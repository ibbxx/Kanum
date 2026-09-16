"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, getSessionUser } from "@/lib/supabase/client";
import { ImageValidationError } from "@/lib/image/compressImage";
import {
  deleteStorageObject,
  resolveStorageRef,
  uploadImageCompressed,
  type ImageBucket,
  type StorageRef,
} from "@/lib/image/storage";
import { extractImageSrcs } from "@/lib/sanitize-html";
import type { ContentEditorHandle } from "@/components/MateriContentEditor";

/**
 * Pipeline bersama form konten admin (materi & budaya).
 *
 * Yang dikelola di sini — semuanya identik di kedua entitas, dulu disalin
 * apa adanya ke dua file modal:
 *  - draft + pembandingnya (dirty), reset saat modal dibuka,
 *  - staged upload gambar isi konten (blob → storage) beserta proteksi orphan,
 *  - cover: file tertunda + preview blob lokal,
 *  - Escape → konfirmasi buang perubahan,
 *  - urutan simpan yang AMAN:
 *      upload baru → tulis DB → DB gagal = hapus file baru;
 *      DB sukses = baru hapus file lama yang tak lagi direferensikan.
 *
 * Callback konfigurasi (toDraft/isDirty/validate/…) HARUS stabil —
 * definisikan di module scope. Beberapa dipakai di dependency effect,
 * jadi fungsi inline akan membuat reset draft berjalan tiap render.
 */

export type ShowToast = (message: string, type?: "success" | "error" | "info") => void;

/** Kolom baris DB yang wajib ada di kedua entitas. */
type ContentRow = {
  id: string;
  image_url: string | null;
  content_html: string;
  sort_order: number;
};

/** Field draft yang wajib ada di kedua entitas (sisanya spesifik). */
type ContentDraft = {
  content_html: string;
  image_url: string | null;
  is_published: boolean;
};

/** Kolom yang DIURUS hook (bukan milik entitas) saat menulis baris. */
export type ManagedFields = {
  sort_order: number;
  image_url: string | null;
  content_html: string;
  is_published: boolean;
};

/** Cukup `message` — bentuk error PostgREST yang dipakai hook. */
export type PersistResult = { error: { message: string } | null };

type Options<D extends ContentDraft, T extends ContentRow> = {
  open: boolean;
  /** null = entri baru. */
  editing: T | null;
  /** Bucket Storage untuk cover & gambar isi konten. */
  bucket: ImageBucket;
  /** Prefiks pesan log, mis. "MateriFormModal". */
  logTag: string;
  toDraft: (row: T | null) => D;
  isDirty: (draft: D, initial: D) => boolean;
  /** Pesan error bila draft tidak valid; null bila lolos. */
  validate: (draft: D) => string | null;
  /**
   * Tulis baris ke tabel entitas ini. Dipasok pemanggil supaya tipe
   * insert/update ditentukan generated Database types per-tabel — hook
   * generik tidak bisa memetakan nama tabel (nilai runtime) ke tipe baris.
   */
  persist: (args: {
    /** id baris: dipakai untuk UPDATE, dan sebagai id INSERT baru. */
    rowId: string;
    /** true = UPDATE `editing`, false = INSERT baris baru. */
    isEdit: boolean;
    userId: string;
    /** Draft entitas (kolom spesifik entitas diambil dari sini). */
    draft: D;
    /** Kolom yang diurus hook. */
    managed: ManagedFields;
  }) => Promise<PersistResult>;
  savedMessage: (isEdit: boolean) => string;
  /** Sort order untuk entri baru (max + 1). */
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
  showToast: ShowToast;
};

export function useContentForm<D extends ContentDraft, T extends ContentRow>(
  options: Options<D, T>,
) {
  const {
    open,
    editing,
    bucket,
    logTag,
    toDraft,
    isDirty,
    validate,
    persist,
    savedMessage,
    nextSortOrder,
    onClose,
    onSaved,
    showToast,
  } = options;

  const [draft, setDraft] = useState<D>(() => toDraft(editing));
  const [initial, setInitial] = useState<D>(() => toDraft(editing));
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const editorRef = useRef<ContentEditorHandle>(null);
  /** blobUrl → { url storage, ref storage } untuk penggantian & cleanup. */
  const stagedRef = useRef<Map<string, { url: string; ref: StorageRef }>>(new Map());
  const failedBlobsRef = useRef<Set<string>>(new Set());

  const set = <K extends keyof D>(key: K, val: D[K]) =>
    setDraft((p) => ({ ...p, [key]: val }));

  const dirty = isDirty(draft, initial);

  /* ── Staged upload gambar isi konten ─────────────────────────────────────
     Gambar di-upload saat admin memilihnya (preview & Save cepat);
     referensinya baru masuk content_html saat Save. */

  const handleStaged = useCallback(
    ({ blobUrl, file }: { blobUrl: string; file: File }) => {
      void (async () => {
        try {
          const supabase = createClient();
          const user = await getSessionUser(supabase);
          if (!user) throw new Error("no-session");
          const up = await uploadImageCompressed(file, {
            bucket,
            userId: user.id,
            entityKey: editing?.id || "new",
            subfolder: "content",
          });
          stagedRef.current.set(blobUrl, {
            url: up.publicUrl,
            ref: { bucket: up.bucket, path: up.path },
          });
        } catch (err) {
          // Upload gagal → blob ditandai; saat Save blob ini dibuang dari
          // konten (tidak pernah tersimpan sebagai base64/blob di DB).
          failedBlobsRef.current.add(blobUrl);
          console.error(`[${logTag}] upload gambar konten gagal:`, err);
          showToast("Ada gambar yang gagal diunggah dan tidak akan tersimpan.", "error");
        }
      })();
    },
    [bucket, editing, logTag, showToast],
  );

  /** Upload hasil crop (pipeline existing) → URL storage permanen. */
  const uploadForCrop = useCallback(
    async (file: File) => {
      const supabase = createClient();
      const user = await getSessionUser(supabase);
      if (!user) throw new Error("no-session");
      const up = await uploadImageCompressed(file, {
        bucket,
        userId: user.id,
        entityKey: editing?.id || "new",
        subfolder: "content",
      });
      return up.publicUrl;
    },
    [bucket, editing],
  );

  /** Hapus semua upload isi konten sesi ini yang belum terreferensi konten. */
  const cleanupStaged = useCallback(
    async (keepPaths: Set<string> | null) => {
      for (const [, info] of stagedRef.current) {
        if (keepPaths && keepPaths.has(info.ref.path)) continue;
        const ok = await deleteStorageObject(info.ref);
        if (!ok)
          console.error(`[${logTag}] file konten orphan perlu dibersihkan manual:`, info.ref);
      }
      stagedRef.current.clear();
      failedBlobsRef.current.clear();
    },
    [logTag],
  );

  /* ── Cover ─────────────────────────────────────────────────────────────── */

  /** Pilih file cover → simpan sebagai pending + tampilkan preview lokal. */
  const pickCover = useCallback(
    (file: File) => {
      setPendingFile(file);
      setDraft((p) => ({ ...p, image_url: URL.createObjectURL(file) }));
    },
    [],
  );

  const removeCover = useCallback(() => {
    setPendingFile(null);
    setDraft((p) => ({ ...p, image_url: null }));
  }, []);

  /* ── Siklus buka/tutup ─────────────────────────────────────────────────── */

  // Setiap kali modal dibuka: muat ulang data (atau kosong untuk entri baru).
  useEffect(() => {
    if (open) {
      const d = toDraft(editing);
      setDraft(d);
      setInitial(d);
      setPendingFile(null);
      setConfirmClose(false);
    }
    // sengaja [open, editing] — callback konfigurasi wajib stabil (lihat doc di atas)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // Deps memakai `dirty` (boolean), bukan `isDirty` — callback konfigurasi
  // bisa beridentitas baru tiap render; listener Escape tidak perlu di-ulang
  // hanya karena itu, cukup saat status kotor benar-benar berubah.
  const requestClose = useCallback(() => {
    if (saving) return;
    if (dirty) {
      setConfirmClose(true);
      return;
    }
    // tutup tanpa save → buang upload yang tak terpakai
    void cleanupStaged(null);
    onClose();
  }, [saving, dirty, cleanupStaged, onClose]);

  const discardAndClose = useCallback(() => {
    setConfirmClose(false);
    void cleanupStaged(null);
    onClose();
  }, [cleanupStaged, onClose]);

  // Escape → tutup (dengan konfirmasi bila ada perubahan belum disimpan).
  // Penguncian scroll body + struktur header/scroll/footer ditangani ModalShell.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape menutup lapisan teratas dulu (dialog konfirmasi), baru modal.
      if (confirmClose) setConfirmClose(false);
      else requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirmClose, requestClose]);

  /* ── Simpan ────────────────────────────────────────────────────────────── */

  async function handleSave() {
    if (saving) return; // cegah double submit
    const invalid = validate(draft);
    if (invalid) {
      showToast(invalid, "error");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const user = await getSessionUser(supabase);
      if (!user) {
        showToast("Sesi tidak ditemukan. Silakan login ulang.", "error");
        return;
      }
      const rowId = editing?.id || crypto.randomUUID();

      // Konten: ganti blob → URL storage, buang blob yang gagal upload.
      const replaceMap = new Map<string, string>();
      for (const [blob, info] of stagedRef.current) {
        if (!failedBlobsRef.current.has(blob)) replaceMap.set(blob, info.url);
      }
      const contentFinal =
        editorRef.current?.getHtmlWithReplacements(replaceMap) ?? draft.content_html;

      let imageUrl = draft.image_url;
      let newlyUploaded: StorageRef | null = null;
      const oldImageRefs: StorageRef[] = [];
      const originalRef = resolveStorageRef(editing?.image_url ?? null);

      if (pendingFile) {
        try {
          const uploaded = await uploadImageCompressed(pendingFile, {
            bucket,
            userId: user.id,
            entityKey: rowId,
          });
          imageUrl = uploaded.publicUrl;
          newlyUploaded = { bucket: uploaded.bucket, path: uploaded.path };
        } catch (err) {
          if (err instanceof ImageValidationError) showToast(err.message, "error");
          else {
            showToast("Gambar gagal diunggah. Silakan coba lagi.", "error");
            console.error(`[${logTag}] upload gambar gagal:`, err);
          }
          return;
        }
      }
      if (originalRef && (!newlyUploaded || newlyUploaded.path !== originalRef.path)) {
        // File lama tak lagi direferensikan (diganti / dihapus dari form).
        oldImageRefs.push(originalRef);
      }

      const { error } = await persist({
        rowId,
        isEdit: Boolean(editing),
        userId: user.id,
        draft,
        managed: {
          sort_order: editing?.sort_order ?? nextSortOrder,
          image_url: imageUrl,
          content_html: contentFinal, // HTML bersih dari editor (tersanitasi)
          is_published: draft.is_published,
        },
      });

      if (error) {
        // Orphan protection: upload sukses tapi DB gagal → hapus file baru
        // (cover baru + semua gambar konten sesi ini).
        if (newlyUploaded) {
          const ok = await deleteStorageObject(newlyUploaded);
          if (!ok)
            console.error(`[${logTag}] orphan file perlu dibersihkan manual:`, newlyUploaded);
        }
        await cleanupStaged(null);
        showToast(error.message, "error");
        return;
      }

      // DB sudah berhasil → baru aman membersihkan storage:
      // 1) cover lama yang tak lagi direferensikan,
      // 2) gambar konten lama yang sudah dihapus admin dari artikel,
      // 3) upload sesi ini yang tidak ikut tersimpan.
      const keepPaths = new Set<string>();
      for (const src of extractImageSrcs(contentFinal)) {
        const ref = resolveStorageRef(src);
        if (ref) keepPaths.add(ref.path);
      }
      for (const ref of oldImageRefs) {
        if (!keepPaths.has(ref.path)) {
          const ok = await deleteStorageObject(ref);
          if (!ok)
            console.error(`[${logTag}] gambar lama gagal dihapus (perlu retry manual):`, ref);
        }
      }
      const oldContentRefs = extractImageSrcs(editing?.content_html ?? "")
        .map((src) => resolveStorageRef(src))
        .filter((r): r is StorageRef => r !== null);
      for (const ref of oldContentRefs) {
        if (!keepPaths.has(ref.path)) {
          const ok = await deleteStorageObject(ref);
          if (!ok)
            console.error(
              `[${logTag}] gambar konten lama gagal dihapus (perlu retry manual):`,
              ref,
            );
        }
      }
      await cleanupStaged(keepPaths);

      showToast(savedMessage(Boolean(editing)), "success");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return {
    draft,
    set,
    dirty,
    saving,
    confirmClose,
    setConfirmClose,
    requestClose,
    discardAndClose,
    handleSave,
    editorRef,
    handleStaged,
    uploadForCrop,
    pendingFile,
    pickCover,
    removeCover,
  };
}

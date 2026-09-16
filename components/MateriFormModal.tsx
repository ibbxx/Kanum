"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageValidationError } from "@/lib/image/compressImage";
import {
  deleteStorageObject,
  resolveStorageRef,
  uploadImageCompressed,
  type StorageRef,
} from "@/lib/image/storage";
import type { Materi } from "@/lib/types";
import { extractImageSrcs } from "@/lib/sanitize-html";
import MateriContentEditor, {
  type ContentEditorHandle,
} from "@/components/MateriContentEditor";
import { Icon } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";
import {
  ActionButton,
  ConfirmDialog,
  Field,
  inputCls,
  ModalFooter,
  ModalShell,
  SectionHead,
} from "@/components/admin/ui";

export type MateriDraft = {
  title: string;
  level: Materi["level"];
  chapter_number: number;
  duration_minutes: number;
  description: string;
  content_html: string;
  image_url: string | null;
  is_published: boolean;
};

type Props = {
  open: boolean;
  /** null = tambah materi baru */
  editing: Materi | null;
  /** urutan untuk materi baru (max sort_order + 1) */
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
};

const LEVELS: Materi["level"][] = ["dasar", "menengah", "lanjut"];
const LEVEL_LABEL: Record<Materi["level"], string> = {
  dasar: "Dasar",
  menengah: "Menengah",
  lanjut: "Lanjut",
};

function toDraft(m: Materi | null): MateriDraft {
  return m
    ? {
        title: m.title,
        level: m.level,
        chapter_number: m.chapter_number,
        duration_minutes: m.duration_minutes,
        description: m.description,
        content_html: m.content_html ?? "",
        image_url: m.image_url,
        is_published: m.is_published,
      }
    : {
        title: "",
        level: "dasar",
        chapter_number: 1,
        duration_minutes: 15,
        description: "",
        content_html: "",
        image_url: null,
        is_published: false,
      };
}

function isDraftDirty(d: MateriDraft, initial: MateriDraft): boolean {
  return (
    d.title !== initial.title ||
    d.level !== initial.level ||
    d.chapter_number !== initial.chapter_number ||
    d.duration_minutes !== initial.duration_minutes ||
    d.description !== initial.description ||
    d.content_html !== initial.content_html ||
    d.image_url !== initial.image_url ||
    d.is_published !== initial.is_published
  );
}

export default function MateriFormModal({
  open,
  editing,
  nextSortOrder,
  onClose,
  onSaved,
  showToast,
}: Props) {
  const [draft, setDraft] = useState<MateriDraft>(() => toDraft(editing));
  const [initial, setInitial] = useState<MateriDraft>(() => toDraft(editing));
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Staged upload: gambar konten di-upload saat admin memilihnya (agar
  // preview & Save cepat), referensinya baru masuk content_html saat Save.
  // blobUrl → { url storage, ref storage } untuk penggantian & cleanup.
  const editorRef = useRef<ContentEditorHandle>(null);
  const stagedRef = useRef<Map<string, { url: string; ref: StorageRef }>>(new Map());
  const failedBlobsRef = useRef<Set<string>>(new Set());

  const handleStaged = useCallback(
    ({ blobUrl, file }: { blobUrl: string; file: File }) => {
      void (async () => {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("no-session");
          const up = await uploadImageCompressed(file, {
            bucket: "materi-images",
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
          console.error("[MateriFormModal] upload gambar konten gagal:", err);
          showToast("Ada gambar yang gagal diunggah dan tidak akan tersimpan.", "error");
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editing],
  );

  /** Hapus semua upload konten sesi ini yang belum terreferensi konten. */
  const cleanupStaged = useCallback(async (keepPaths: Set<string> | null) => {
    for (const [, info] of stagedRef.current) {
      if (keepPaths && keepPaths.has(info.ref.path)) continue;
      const ok = await deleteStorageObject(info.ref);
      if (!ok)
        console.error("[MateriFormModal] file konten orphan perlu dibersihkan manual:", info.ref);
    }
    stagedRef.current.clear();
    failedBlobsRef.current.clear();
  }, []);

  /** Upload hasil crop gambar (pipeline existing) → URL storage permanen. */
  const uploadForCrop = useCallback(async (file: File) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("no-session");
    const up = await uploadImageCompressed(file, {
      bucket: "materi-images",
      userId: user.id,
      entityKey: editing?.id || "new",
      subfolder: "content",
    });
    return up.publicUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Setiap kali modal dibuka: muat data materi (atau kosong untuk materi baru).
  useEffect(() => {
    if (open) {
      const d = toDraft(editing);
      setDraft(d);
      setInitial(d);
      setPendingFile(null);
      setConfirmClose(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const dirty = isDraftDirty(draft, initial);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty, confirmClose]);

  function requestClose() {
    if (dirty && !saving) setConfirmClose(true);
    else if (!saving) {
      void cleanupStaged(null); // tutup tanpa save → buang upload yang tak terpakai
      onClose();
    }
  }

  const set = <K extends keyof MateriDraft>(key: K, val: MateriDraft[K]) =>
    setDraft((p) => ({ ...p, [key]: val }));

  // ── Simpan — urutan & proteksi orphan PERSIS pipeline existing ──
  // (upload baru dulu → DB write → DB gagal = hapus file baru;
  //  DB sukses = hapus file lama yang tak lagi direferensikan)
  async function handleSave() {
    if (saving) return; // cegah double submit
    if (!draft.title.trim()) {
      showToast("Judul materi wajib diisi.", "error");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showToast("Sesi tidak ditemukan. Silakan login ulang.", "error");
        return;
      }
      const rowId = editing?.id || crypto.randomUUID();

      // ── Konten: ganti blob → URL storage, buang blob yang gagal upload ──
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
            bucket: "materi-images",
            userId: user.id,
            entityKey: rowId,
          });
          imageUrl = uploaded.publicUrl;
          newlyUploaded = { bucket: uploaded.bucket, path: uploaded.path };
        } catch (err) {
          if (err instanceof ImageValidationError) showToast(err.message, "error");
          else {
            showToast("Gambar gagal diunggah. Silakan coba lagi.", "error");
            console.error("[MateriFormModal] upload gambar gagal:", err);
          }
          return;
        }
      }
      if (originalRef && (!newlyUploaded || newlyUploaded.path !== originalRef.path)) {
        // File lama tak lagi direferensikan (diganti / dihapus dari form).
        oldImageRefs.push(originalRef);
      }

      const payload = {
        title: draft.title.trim(),
        chapter_number: Number(draft.chapter_number) || 1,
        level: draft.level,
        description: draft.description,
        duration_minutes: Number(draft.duration_minutes) || 15,
        sort_order: editing?.sort_order ?? nextSortOrder,
        image_url: imageUrl,
        content_html: contentFinal, // HTML bersih dari editor (tersanitasi)
        is_published: draft.is_published,
      };

      let error;
      if (editing) {
        ({ error } = await supabase.from("materi").update(payload).eq("id", editing.id));
      } else {
        ({ error } = await supabase
          .from("materi")
          .insert({ ...payload, id: rowId, created_by: user.id }));
      }

      if (error) {
        // Orphan protection: upload sukses tapi DB gagal → hapus file baru
        // (cover baru + semua gambar konten sesi ini).
        if (newlyUploaded) {
          const ok = await deleteStorageObject(newlyUploaded);
          if (!ok)
            console.error("[MateriFormModal] orphan file perlu dibersihkan manual:", newlyUploaded);
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
            console.error("[MateriFormModal] gambar lama gagal dihapus (perlu retry manual):", ref);
        }
      }
      const oldContentRefs = extractImageSrcs(editing?.content_html ?? "")
        .map((src) => resolveStorageRef(src))
        .filter((r): r is StorageRef => r !== null);
      for (const ref of oldContentRefs) {
        if (!keepPaths.has(ref.path)) {
          const ok = await deleteStorageObject(ref);
          if (!ok)
            console.error("[MateriFormModal] gambar konten lama gagal dihapus (perlu retry manual):", ref);
        }
      }
      await cleanupStaged(keepPaths);

      showToast(editing ? "Materi berhasil diperbarui." : "Materi baru berhasil dibuat.", "success");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <ModalShell
        title={editing ? "Edit Materi" : "Tambah Materi"}
        description={
          editing ? "Perbarui informasi dan konten materi." : "Buat materi pembelajaran baru."
        }
        onRequestClose={requestClose}
        testId="materi-modal"
        footer={
          <ModalFooter
            dirty={dirty && !saving}
            status={saving ? "Menyimpan..." : dirty ? "● Belum disimpan" : "Tidak ada perubahan"}
            testId="materi-modal-footer"
          >
            <ActionButton onClick={requestClose} disabled={saving}>
              Batal
            </ActionButton>
            <ActionButton variant="primary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Icon name="progress_activity" className="text-[16px] leading-none animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Icon name="check" className="text-[16px] leading-none" />
                  Simpan
                </>
              )}
            </ActionButton>
          </ModalFooter>
        }
      >
        {/* Body — 2 kolom desktop, 1 kolom mobile; konten paling dominan. */}
        <div className="grid grid-cols-1 gap-6 px-5 py-4 pb-6 sm:px-6 sm:py-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* LEFT / MAIN */}
            <div className="space-y-7">
              <section aria-label="Konten Materi">
                <SectionHead
                  title="Konten Materi"
                  desc="Tulis dan format konten secara langsung. Gunakan tab Preview untuk melihat tampilannya."
                />
                <MateriContentEditor
                  ref={editorRef}
                  value={draft.content_html}
                  onChange={(html) => set("content_html", html)}
                  onStaged={handleStaged}
                  uploadForCrop={uploadForCrop}
                />
              </section>

              <section aria-label="Informasi Dasar">
                <SectionHead title="Informasi Dasar" desc="Judul dan ringkasan yang dilihat siswa." />
                <div className="space-y-4 rounded-2xl border border-outline-variant p-4">
                  <Field label="Judul Materi" required>
                    <input
                      value={draft.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="cth. Bilangan Real"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Deskripsi singkat">
                    <textarea
                      value={draft.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Ringkasan 1–2 kalimat tentang materi ini..."
                      rows={3}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </section>
            </div>

            {/* RIGHT / SIDEBAR */}
            <aside className="space-y-6 lg:sticky lg:top-0 lg:self-start">
              <section aria-label="Publikasi">
                <SectionHead title="Publikasi" desc="Kontrol visibilitas materi." />
                <div className="rounded-2xl border border-outline-variant p-4">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold text-on-surface">
                        {draft.is_published ? "Published" : "Draft"}
                      </span>
                      <span className="block text-xs text-on-surface-variant">
                        {draft.is_published
                          ? "Materi terlihat oleh siswa"
                          : "Materi belum terlihat oleh siswa"}
                      </span>
                    </span>
                    <span className="relative inline-flex shrink-0">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={draft.is_published}
                        onChange={(e) => set("is_published", e.target.checked)}
                      />
                      <span className="h-6 w-11 rounded-full bg-surface-container-high transition-colors peer-checked:bg-primary" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                    </span>
                  </label>
                </div>
              </section>

              <section aria-label="Pengaturan">
                <SectionHead title="Pengaturan" desc="Bab, level, dan durasi." />
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-outline-variant p-4">
                  <Field label="Bab">
                    <input
                      type="number"
                      min={1}
                      value={draft.chapter_number}
                      onChange={(e) => set("chapter_number", Number(e.target.value))}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Durasi (menit)">
                    <input
                      type="number"
                      min={0}
                      value={draft.duration_minutes}
                      onChange={(e) => set("duration_minutes", Number(e.target.value))}
                      className={inputCls}
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Level">
                      <select
                        value={draft.level}
                        onChange={(e) => set("level", e.target.value as Materi["level"])}
                        className={inputCls}
                      >
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {LEVEL_LABEL[l]}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              </section>

              <section aria-label="Cover">
                <SectionHead title="Cover" desc="Gambar sampul materi (opsional)." />
                <div className="rounded-2xl border border-outline-variant p-4">
                  {draft.image_url ? (
                    <div className="space-y-3">
                      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-surface-container-low">
                        <SmartImage
                          src={draft.image_url}
                          alt={draft.title || "Cover materi"}
                          sizes="320px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          disabled={saving}
                          className="flex-1 rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-50"
                        >
                          Ganti Cover
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            set("image_url", null);
                            setPendingFile(null);
                          }}
                          disabled={saving}
                          className="rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold text-error hover:bg-error-container/40 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      disabled={saving}
                      className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center transition-colors hover:border-primary hover:bg-surface-container-low"
                    >
                      <Icon name="add_photo_alternate" className="text-[28px] leading-none text-on-surface-variant" />
                      <span className="text-sm font-semibold text-on-surface">
                        {pendingFile ? "Cover siap — klik Simpan" : "Unggah cover"}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        JPG/PNG/WebP — dikompres otomatis
                      </span>
                    </button>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) {
                        setPendingFile(f);
                        set("image_url", URL.createObjectURL(f)); // preview lokal sebelum upload
                      }
                    }}
                  />
                </div>
              </section>
            </aside>
        </div>
      </ModalShell>

      {/* Konfirmasi buang perubahan — dialog konfirmasi seragam admin/ui. */}
      {confirmClose && (
        <ConfirmDialog
          title="Buang perubahan?"
          message="Perubahan yang belum disimpan akan hilang."
          confirmLabel="Buang"
          cancelLabel="Lanjut Edit"
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => {
            setConfirmClose(false);
            void cleanupStaged(null); // draft dibuang → upload tak terpakai dihapus
            onClose();
          }}
        />
      )}
    </>
  );
}

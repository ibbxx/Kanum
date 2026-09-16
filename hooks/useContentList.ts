"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteStoredImageByUrl } from "@/lib/image/storage";
import type { ShowToast } from "@/hooks/useContentForm";

/**
 * State daftar konten admin (materi & budaya) — muat, publish/unpublish
 * cepat, dan hapus. Dulu blok ini disalin utuh ke dua halaman admin.
 *
 * Yang TIDAK diurus di sini: filter/pencarian (predikatnya beda per entitas)
 * dan seluruh tampilan — keduanya tetap milik halaman masing-masing.
 */
type ContentRow = {
  id: string;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
};

type Messages = {
  /** Toast setelah entri diubah menjadi draft. */
  onDraft: string;
  /** Toast setelah entri dipublikasikan. */
  onPublish: string;
  /** Toast setelah entri dihapus. */
  deleted: string;
  /** Toast bila update status gagal. */
  toggleFailed: string;
  /** Toast bila penghapusan gagal. */
  deleteFailed: string;
};

type Options = {
  table: "materi" | "budaya";
  /** Prefiks pesan log, mis. "MateriAdmin". */
  logTag: string;
  messages: Messages;
  showToast: ShowToast;
};

/**
 * Baris hasil `select("*")` pada tabel yang namanya baru diketahui saat
 * runtime tidak bisa dipetakan TypeScript ke `T` (nama tabel adalah nilai,
 * bukan tipe) — padahal bentuk tiap baris sudah dipastikan generated
 * Database types per-tabel. Ini satu-satunya titik narrowing di hook ini.
 */
function asRows<T extends ContentRow>(rows: ContentRow[] | null): T[] {
  return (rows ?? []) as T[];
}

export function useContentList<T extends ContentRow>({
  table,
  logTag,
  messages,
  showToast,
}: Options) {
  const [rows, setRows] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch — HANYA dipanggil dari useEffect (setelah mount).
  // Jangan pernah memanggil load() langsung di body component:
  // setRows/setLoaded saat render memicu warning "Can't perform a React
  // state update on a component that hasn't mounted yet" (React 19).
  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from(table).select("*").order("sort_order");
    if (error) showToast(error.message, "error");
    else setRows(asRows<T>(data));
    setLoaded(true);
  }, [table, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const publishedCount = rows.filter((r) => r.is_published).length;
  const nextSortOrder = rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 1;

  /** Quick publish/unpublish dari list — tanpa membuka form. */
  async function togglePublish(row: T) {
    if (togglingId) return;
    setTogglingId(row.id);
    try {
      const { is_published: isPublished } = row;
      const supabase = createClient();
      const { error } = await supabase
        .from(table)
        .update({ is_published: !isPublished })
        .eq("id", row.id);
      if (error) throw error;
      showToast(isPublished ? messages.onDraft : messages.onPublish, "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : messages.toggleFailed, "error");
    } finally {
      setTogglingId(null);
    }
  }

  // Hapus: DB record dulu; storage menyusul hanya jika DB sukses (logic existing).
  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from(table).delete().eq("id", deleteTarget.id);
      if (error) throw error;
      if (deleteTarget.image_url) {
        const ok = await deleteStoredImageByUrl(deleteTarget.image_url);
        if (!ok)
          console.error(
            `[${logTag}] gambar gagal dihapus (perlu retry manual):`,
            deleteTarget.image_url,
          );
      }
      showToast(messages.deleted, "success");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : messages.deleteFailed, "error");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  return {
    rows,
    loaded,
    reload: load,
    modalOpen,
    editing,
    openAdd,
    openEdit,
    closeModal,
    deleteTarget,
    setDeleteTarget,
    deleting,
    confirmDelete,
    togglingId,
    togglePublish,
    publishedCount,
    nextSortOrder,
  };
}

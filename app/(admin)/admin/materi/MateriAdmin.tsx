"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { Materi } from "@/lib/types";
import { deleteStoredImageByUrl } from "@/lib/image/storage";
import { decorateCaptions, sanitizeHtml } from "@/lib/sanitize-html";
import MateriFormModal from "@/components/MateriFormModal";
import {
  ActionButton,
  CardActionButton,
  CardCover,
  ConfirmDialog,
  EmptyState,
  FilterSelect,
  ListCard,
  ModalShell,
  ResultCount,
  SearchInput,
  StatusBadge,
} from "@/components/admin/ui";

// Nama tampilan level — konsisten dengan halaman materi siswa.
const LEVEL_LABEL: Record<Materi["level"], string> = {
  dasar: "Dasar",
  menengah: "Menengah",
  lanjut: "Lanjut",
};

// Filter daftar materi di sisi klien (behavior legacy dipertahankan):
// search judul + deskripsi, level, status publikasi — tanpa query tambahan
// ke Supabase; sumber data tetap satu kali fetch.
function filterMateri(
  rows: Materi[],
  q: string,
  level: string,
  status: "" | "true" | "false",
): Materi[] {
  const query = q.trim().toLowerCase();
  return rows.filter((m) => {
    const matchQ =
      !query ||
      m.title.toLowerCase().includes(query) ||
      (m.description ?? "").toLowerCase().includes(query);
    const matchL = !level || m.level === level;
    const matchS = status === "" || String(m.is_published) === status;
    return matchQ && matchL && matchS;
  });
}

export function MateriAdmin() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Materi[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Materi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Materi | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Materi | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch materi — HANYA dipanggil dari useEffect (setelah mount).
  // Jangan pernah memanggil load() langsung di body component:
  // setRows/setLoaded saat render memicu warning "Can't perform a React
  // state update on a component that hasn't mounted yet" (React 19).
  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("materi").select("*").order("sort_order");
    if (error) showToast(error.message, "error");
    else setRows((data || []) as Materi[]);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = filterMateri(rows, query, levelFilter, statusFilter);
  const publishedCount = rows.filter((m) => m.is_published).length;
  const nextSortOrder = rows.length ? Math.max(...rows.map((m) => m.sort_order)) + 1 : 1;

  // Quick publish/unpublish dari list — tanpa membuka form.
  async function togglePublish(m: Materi) {
    if (togglingId) return;
    setTogglingId(m.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("materi")
        .update({ is_published: !m.is_published })
        .eq("id", m.id);
      if (error) throw error;
      showToast(m.is_published ? "Materi dijadikan draft." : "Materi dipublikasikan.", "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal mengubah status.", "error");
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
      const { error } = await supabase.from("materi").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      if (deleteTarget.image_url) {
        const ok = await deleteStoredImageByUrl(deleteTarget.image_url);
        if (!ok)
          console.error(
            "[MateriAdmin] gambar materi gagal dihapus (perlu retry manual):",
            deleteTarget.image_url,
          );
      }
      showToast("Materi dihapus.", "success");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus materi.", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(m: Materi) {
    setEditing(m);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-on-surface">Kelola Materi</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Kelola, edit, dan publikasikan materi pembelajaran.
          </p>
        </div>
        <ActionButton
          variant="primary"
          onClick={openAdd}
          data-testid="add-materi"
          className="w-full sm:w-auto"
        >
          <Icon name="add" className="text-[20px] leading-none" />
          Tambah Materi
        </ActionButton>
      </div>

      {/* ── Toolbar: search + filter ── */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari materi berdasarkan judul..."
          ariaLabel="Cari materi"
        />
        <FilterSelect value={levelFilter} onChange={setLevelFilter} ariaLabel="Filter level">
          <option value="">Semua Level</option>
          <option value="dasar">Dasar</option>
          <option value="menengah">Menengah</option>
          <option value="lanjut">Lanjut</option>
        </FilterSelect>
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as "" | "true" | "false")}
          ariaLabel="Filter status"
        >
          <option value="">Semua Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </FilterSelect>
        <ResultCount>
          {filtered.length} dari {rows.length} materi · {publishedCount} published
        </ResultCount>
      </div>

      {/* ── Daftar materi ── */}
      {loaded && rows.length === 0 ? (
        <EmptyState
          icon="menu_book"
          title="Belum ada materi"
          desc="Buat materi pertama untuk mulai mengisi pembelajaran."
          action={
            <ActionButton variant="primary" onClick={openAdd} className="mt-4">
              <Icon name="add" className="text-[20px] leading-none" />
              Tambah Materi
            </ActionButton>
          }
        />
      ) : loaded && filtered.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="Tidak ada materi yang cocok"
          desc="Coba kata kunci lain atau ubah filter."
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((m, i) => (
            <li key={m.id}>
              <MateriCard
                materi={m}
                index={i + 1}
                busy={togglingId === m.id}
                onEdit={() => openEdit(m)}
                onPreview={() => setPreviewTarget(m)}
                onTogglePublish={() => void togglePublish(m)}
                onDelete={() => setDeleteTarget(m)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* ── Modal form (WYSIWYG) ── */}
      <MateriFormModal
        open={modalOpen}
        editing={editing}
        nextSortOrder={nextSortOrder}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          void load();
        }}
        showToast={showToast}
      />

      {/* ── Pratinjau materi (read-only, tanpa keluar halaman admin) ── */}
      {previewTarget ? (
        <ModalShell
          eyebrow="Pratinjau materi"
          title={previewTarget.title}
          maxWidth="sm:max-w-3xl"
          closeLabel="Tutup pratinjau"
          onRequestClose={() => setPreviewTarget(null)}
          testId="materi-preview"
          footer={
            <div className="flex shrink-0 justify-end border-t border-outline-variant px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
              <ActionButton onClick={() => setPreviewTarget(null)}>Tutup</ActionButton>
            </div>
          }
        >
          <div className="px-5 py-4 sm:px-6">
            {previewTarget.content_html ? (
              <div
                className="prose-kanum"
                // HTML sudah lolos sanitizer saat disimpan; disanitasi ulang
                // agar baris legacy pun aman dirender.
                dangerouslySetInnerHTML={{
                  __html: decorateCaptions(sanitizeHtml(previewTarget.content_html)),
                }}
              />
            ) : (
              <p className="text-sm italic text-on-surface-variant">Konten materi belum diisi.</p>
            )}
          </div>
        </ModalShell>
      ) : null}

      {/* ── Konfirmasi hapus ── */}
      {deleteTarget ? (
        <ConfirmDialog
          icon="delete"
          title="Hapus Materi?"
          message={
            <>
              <strong className="text-on-surface">{deleteTarget.title}</strong> akan dihapus secara
              permanen. Tindakan ini tidak dapat dibatalkan.
            </>
          }
          confirmLabel="Hapus"
          busyLabel="Menghapus..."
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}

/* ── Kartu materi ── */

function MateriCard({
  materi: m,
  index,
  busy,
  onEdit,
  onPreview,
  onTogglePublish,
  onDelete,
}: {
  materi: Materi;
  index: number;
  busy: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <ListCard
      cover={<CardCover src={m.image_url} alt={m.title} />}
      info={
        <>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-bold text-on-surface-variant/70">#{index}</span>
            <h3 className="truncate font-display text-sm font-bold text-on-surface sm:text-base">
              {m.title}
            </h3>
            <StatusBadge published={m.is_published} />
          </div>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            Bab {m.chapter_number || "–"} · {LEVEL_LABEL[m.level] ?? m.level} ·{" "}
            {m.duration_minutes} menit
          </p>
          {m.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant/80">{m.description}</p>
          ) : null}
        </>
      }
      actions={
        <>
          <CardActionButton onClick={onEdit} icon="edit" label="Edit" title="Edit materi" />
          <CardActionButton
            onClick={onPreview}
            icon="visibility"
            label="Pratinjau"
            title="Pratinjau materi"
            tone="muted"
          />
          <CardActionButton
            onClick={onTogglePublish}
            icon={m.is_published ? "unpublish" : "publish"}
            label={m.is_published ? "Unpublish" : "Publish"}
            title={m.is_published ? "Jadikan draft" : "Publikasikan"}
            tone={m.is_published ? "muted" : "primary"}
            busy={busy}
            disabled={busy}
          />
          <CardActionButton onClick={onDelete} icon="delete" label="Hapus" tone="danger" />
        </>
      }
    />
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { Budaya } from "@/lib/types";
import { deleteStoredImageByUrl } from "@/lib/image/storage";
import BudayaFormModal from "@/components/BudayaFormModal";
import {
  ActionButton,
  CardActionButton,
  CardCover,
  ConfirmDialog,
  EmptyState,
  FilterSelect,
  ListCard,
  ResultCount,
  SearchInput,
  StatusBadge,
} from "@/components/admin/ui";

// Filter daftar budaya di sisi klien (behavior legacy dipertahankan):
// search judul/topic_key + status publikasi — tanpa query tambahan
// ke Supabase; sumber data tetap satu kali fetch.
function filterBudaya(
  rows: Budaya[],
  q: string,
  status: "" | "true" | "false",
): Budaya[] {
  const query = q.trim().toLowerCase();
  return rows.filter((b) => {
    const matchQ =
      !query ||
      b.title.toLowerCase().includes(query) ||
      (b.topic_key || "").toLowerCase().includes(query);
    const matchS = status === "" || String(b.is_published) === status;
    return matchQ && matchS;
  });
}

export function BudayaAdmin() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Budaya[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budaya | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budaya | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch budaya — HANYA dipanggil dari useEffect (setelah mount).
  // Jangan pernah memanggil load() langsung di body component (React 19:
  // state update sebelum mount memicu warning).
  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("budaya").select("*").order("sort_order");
    if (error) showToast(error.message, "error");
    else setRows((data || []) as Budaya[]);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = filterBudaya(rows, query, statusFilter);
  const publishedCount = rows.filter((b) => b.is_published).length;
  const nextSortOrder = rows.length ? Math.max(...rows.map((b) => b.sort_order)) + 1 : 1;

  // Quick publish/unpublish dari list — tanpa membuka form.
  async function togglePublish(b: Budaya) {
    if (togglingId) return;
    setTogglingId(b.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("budaya")
        .update({ is_published: !b.is_published })
        .eq("id", b.id);
      if (error) throw error;
      showToast(b.is_published ? "Konten dijadikan draft." : "Konten dipublikasikan.", "success");
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
      const { error } = await supabase.from("budaya").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      if (deleteTarget.image_url) {
        const ok = await deleteStoredImageByUrl(deleteTarget.image_url);
        if (!ok)
          console.error(
            "[BudayaAdmin] gambar budaya gagal dihapus (perlu retry manual):",
            deleteTarget.image_url,
          );
      }
      showToast("Konten budaya dihapus.", "success");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Gagal menghapus konten.", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(b: Budaya) {
    setEditing(b);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-on-surface">Kelola Budaya</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Kelola, edit, dan publikasikan konten budaya Ammatoa Kajang.
          </p>
        </div>
        <ActionButton
          variant="primary"
          onClick={openAdd}
          data-testid="add-budaya"
          className="w-full sm:w-auto"
        >
          <Icon name="add" className="text-[20px] leading-none" />
          Tambah Budaya
        </ActionButton>
      </div>

      {/* ── Toolbar: search + filter ── */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari judul atau key..."
          ariaLabel="Cari konten budaya"
        />
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
          {filtered.length} dari {rows.length} konten · {publishedCount} published
        </ResultCount>
      </div>

      {/* ── Daftar budaya ── */}
      {loaded && rows.length === 0 ? (
        <EmptyState
          icon="diversity_2"
          title="Belum ada konten budaya"
          desc="Buat konten pertama untuk mulai mengisi pembelajaran budaya."
          action={
            <ActionButton variant="primary" onClick={openAdd} className="mt-4">
              <Icon name="add" className="text-[20px] leading-none" />
              Tambah Budaya
            </ActionButton>
          }
        />
      ) : loaded && filtered.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="Tidak ada konten yang cocok"
          desc="Coba kata kunci lain atau ubah filter."
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {filtered.map((b) => (
            <li key={b.id}>
              <BudayaCard
                budaya={b}
                busy={togglingId === b.id}
                onEdit={() => openEdit(b)}
                onTogglePublish={() => void togglePublish(b)}
                onDelete={() => setDeleteTarget(b)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* ── Modal form (WYSIWYG) ── */}
      <BudayaFormModal
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

      {/* ── Konfirmasi hapus ── */}
      {deleteTarget ? (
        <ConfirmDialog
          icon="delete"
          title="Hapus Konten Budaya?"
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

/* ── Kartu budaya ── */

function BudayaCard({
  budaya: b,
  busy,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  budaya: Budaya;
  busy: boolean;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <ListCard
      cover={<CardCover src={b.image_url} alt={b.title} />}
      info={
        <>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="truncate font-display text-sm font-bold text-on-surface sm:text-base">
              {b.title}
            </h3>
            <StatusBadge published={b.is_published} />
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant">
            <code className="rounded bg-surface-container-low px-1.5 py-0.5 text-[11px]">
              {b.topic_key}
            </code>
            <span>{b.category}</span>
          </p>
          {b.description ? (
            <p className="mt-1 line-clamp-1 min-w-0 break-words text-xs text-on-surface-variant/80">
              {b.description}
            </p>
          ) : null}
        </>
      }
      actions={
        <>
          <CardActionButton onClick={onEdit} icon="edit" label="Edit" title="Edit konten" />
          <CardActionButton
            onClick={onTogglePublish}
            icon={b.is_published ? "unpublish" : "publish"}
            label={b.is_published ? "Unpublish" : "Publish"}
            title={b.is_published ? "Jadikan draft" : "Publikasikan"}
            tone={b.is_published ? "muted" : "primary"}
            busy={busy}
            disabled={busy}
          />
          <CardActionButton onClick={onDelete} icon="delete" label="Hapus" tone="danger" />
        </>
      }
    />
  );
}

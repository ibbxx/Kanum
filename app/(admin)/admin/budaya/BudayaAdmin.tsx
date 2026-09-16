"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { Budaya } from "@/lib/types";
import { useContentList } from "@/hooks/useContentList";
import dynamic from "next/dynamic";
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

/**
 * Modal form + editor WYSIWYG dimuat HANYA saat dibuka (lihat catatan panjang
 * di MateriAdmin). Modal sudah `if (!open) return null`, jadi anaknya (editor)
 * tidak pernah ter-mount saat tertutup — menunda unduhan tidak mengubah
 * perilaku, hanya menghilangkan ~150 kB editor dari initial load
 * `/admin/budaya` & `/guru/budaya`.
 */
const loadBudayaFormModal = () => import("@/components/BudayaFormModal");
const BudayaFormModal = dynamic(loadBudayaFormModal, { ssr: false });

/** Pemanasan chunk saat ada niat membuka form (lihat MateriAdmin). */
function warmFormModal() {
  void loadBudayaFormModal();
}

const MESSAGES = {
  onDraft: "Konten dijadikan draft.",
  onPublish: "Konten dipublikasikan.",
  deleted: "Konten budaya dihapus.",
  toggleFailed: "Gagal mengubah status.",
  deleteFailed: "Gagal menghapus konten.",
};

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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");

  const {
    rows,
    loaded,
    reload,
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
  } = useContentList<Budaya>({
    table: "budaya",
    logTag: "BudayaAdmin",
    messages: MESSAGES,
    showToast,
  });

  const filtered = filterBudaya(rows, query, statusFilter);

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
          onPointerEnter={warmFormModal}
          onFocus={warmFormModal}
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
            <ActionButton
              variant="primary"
              onClick={openAdd}
              onPointerEnter={warmFormModal}
              onFocus={warmFormModal}
              className="mt-4"
            >
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
            <li key={b.id} onPointerEnter={warmFormModal}>
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
      {modalOpen && (
        <BudayaFormModal
          open={modalOpen}
          editing={editing}
          nextSortOrder={nextSortOrder}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            void reload();
          }}
          showToast={showToast}
        />
      )}

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
            icon={b.is_published ? "unpublished" : "publish"}
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

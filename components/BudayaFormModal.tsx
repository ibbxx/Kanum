"use client";

import { startTransition } from "react";
import type { Budaya } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useContentForm, type ShowToast } from "@/hooks/useContentForm";
import MateriContentEditor from "@/components/MateriContentEditor";
import {
  ConfirmDialog,
  CoverField,
  Field,
  inputCls,
  ModalShell,
  PublishToggle,
  SaveFooter,
  SectionHead,
} from "@/components/admin/ui";

type BudayaDraft = {
  title: string;
  topic_key: string;
  category: string;
  description: string;
  content_html: string;
  image_url: string | null;
  is_published: boolean;
};

type Props = {
  open: boolean;
  /** null = tambah budaya baru */
  editing: Budaya | null;
  /** urutan untuk budaya baru (max sort_order + 1) */
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
  showToast: ShowToast;
};

/* Callback konfigurasi di bawah ini sengaja di module scope: dipakai di
   dependency internal useContentForm, jadi identitasnya harus stabil. */

function toDraft(m: Budaya | null): BudayaDraft {
  return m
    ? {
        title: m.title,
        topic_key: m.topic_key,
        category: m.category || "Umum",
        description: m.description,
        content_html: m.content_html ?? "",
        image_url: m.image_url,
        is_published: m.is_published,
      }
    : {
        title: "",
        topic_key: "",
        category: "Umum",
        description: "",
        content_html: "",
        image_url: null,
        is_published: false,
      };
}

function isDraftDirty(d: BudayaDraft, initial: BudayaDraft): boolean {
  return (
    d.title !== initial.title ||
    d.topic_key !== initial.topic_key ||
    d.category !== initial.category ||
    d.description !== initial.description ||
    d.content_html !== initial.content_html ||
    d.image_url !== initial.image_url ||
    d.is_published !== initial.is_published
  );
}

function validateDraft(d: BudayaDraft): string | null {
  return d.title.trim() && d.topic_key.trim() ? null : "Judul dan topic key wajib diisi.";
}

function buildPayload(d: BudayaDraft) {
  return {
    title: d.title.trim(),
    // Normalisasi topic_key seperti legacy: lowercase + spasi → strip.
    topic_key: d.topic_key.trim().toLowerCase().replace(/\s+/g, "-"),
    category: d.category.trim() || "Umum",
    description: d.description,
  };
}

/**
 * Penulisan baris budaya — di sini tipe `Insert`/`Update` ditentukan
 * generated Database types, sehingga tidak ada cast pada hasil query.
 * Identitas stabil (module scope) agar tidak memicu effect di hook.
 */
const persist: NonNullable<
  Parameters<typeof useContentForm<BudayaDraft, Budaya>>[0]["persist"]
> = async ({ rowId, isEdit, userId, draft, managed }) => {
  const supabase = createClient();
  const body = { ...buildPayload(draft), ...managed };
  if (isEdit) {
    return await supabase.from("budaya").update(body).eq("id", rowId);
  }
  return await supabase
    .from("budaya")
    .insert({ ...body, id: rowId, created_by: userId });
};

export default function BudayaFormModal({
  open,
  editing,
  nextSortOrder,
  onClose,
  onSaved,
  showToast,
}: Props) {
  const {
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
  } = useContentForm<BudayaDraft, Budaya>({
    open,
    editing,
    bucket: "budaya-images",
    logTag: "BudayaFormModal",
    toDraft,
    isDirty: isDraftDirty,
    validate: validateDraft,
    persist,
    savedMessage: (isEdit) =>
      isEdit ? "Konten budaya berhasil diperbarui." : "Konten budaya berhasil dibuat.",
    nextSortOrder,
    onClose,
    onSaved,
    showToast,
  });

  if (!open) return null;

  return (
    <>
      <ModalShell
        title={editing ? "Edit Budaya" : "Tambah Budaya"}
        description={
          editing ? "Perbarui informasi dan konten budaya." : "Buat konten budaya baru."
        }
        onRequestClose={requestClose}
        testId="budaya-modal"
        footer={
          <SaveFooter
            dirty={dirty}
            saving={saving}
            onCancel={requestClose}
            onSave={() => void handleSave()}
          />
        }
      >
        {/* Body — 2 kolom desktop, 1 kolom mobile; konten paling dominan. */}
        <div className="grid grid-cols-1 gap-6 px-5 py-4 pb-6 sm:px-6 sm:py-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* LEFT / MAIN */}
          <div className="space-y-7">
            <section aria-label="Konten Budaya">
              <SectionHead
                title="Konten Budaya"
                desc="Tulis dan format konten secara langsung. Gunakan tab Preview untuk melihat tampilannya."
              />
              <MateriContentEditor
                ref={editorRef}
                value={draft.content_html}
                /* Lihat catatan pada MateriFormModal: pembaruan draft dari
                   ketikan dibuat non-urgent (interruptible) — isi yang
                   disimpan tetap dibaca dari instance editor saat Save. */
                onChange={(html) => startTransition(() => set("content_html", html))}
                placeholder="Tulis konten budaya di sini..."
                onStaged={handleStaged}
                uploadForCrop={uploadForCrop}
              />
            </section>

            <section aria-label="Informasi Dasar">
              <SectionHead title="Informasi Dasar" desc="Judul, kategori, dan ringkasan." />
              <div className="space-y-4 rounded-2xl border border-outline-variant p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Judul Budaya" required>
                    <input
                      value={draft.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="cth. Pakaian Adat Ammatoa"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Kategori">
                    <input
                      value={draft.category}
                      onChange={(e) => set("category", e.target.value)}
                      placeholder="cth. Tradisi"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field
                  label="Topic Key (unik)"
                  required
                  hint="Otomatis dinormalisasi: huruf kecil, spasi menjadi tanda strip."
                >
                  <input
                    value={draft.topic_key}
                    onChange={(e) => set("topic_key", e.target.value)}
                    placeholder="cth. pakaian-adat"
                    className={inputCls}
                  />
                </Field>
                <Field label="Deskripsi singkat">
                  <textarea
                    value={draft.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Ringkasan 1–2 kalimat tentang konten ini..."
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
              <SectionHead title="Publikasi" desc="Kontrol visibilitas konten." />
              <PublishToggle
                value={draft.is_published}
                onChange={(v) => set("is_published", v)}
                hintOn="Terlihat oleh siswa"
                hintOff="Belum terlihat oleh siswa"
                disabled={saving}
              />
            </section>

            <section aria-label="Cover">
              <SectionHead title="Cover" desc="Gambar sampul (opsional)." />
              <CoverField
                value={draft.image_url}
                alt={draft.title || "Cover budaya"}
                pending={Boolean(pendingFile)}
                disabled={saving}
                onPick={pickCover}
                onClear={removeCover}
              />
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
          onConfirm={discardAndClose}
        />
      )}
    </>
  );
}

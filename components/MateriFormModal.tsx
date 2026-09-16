"use client";

import type { Materi } from "@/lib/types";
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

type MateriDraft = {
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
  showToast: ShowToast;
};

const LEVELS: Materi["level"][] = ["dasar", "menengah", "lanjut"];
const LEVEL_LABEL: Record<Materi["level"], string> = {
  dasar: "Dasar",
  menengah: "Menengah",
  lanjut: "Lanjut",
};

/* Callback konfigurasi di bawah ini sengaja di module scope: dipakai di
   dependency internal useContentForm, jadi identitasnya harus stabil. */

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

function validateDraft(d: MateriDraft): string | null {
  return d.title.trim() ? null : "Judul materi wajib diisi.";
}

function buildPayload(d: MateriDraft) {
  return {
    title: d.title.trim(),
    chapter_number: Number(d.chapter_number) || 1,
    level: d.level,
    description: d.description,
    duration_minutes: Number(d.duration_minutes) || 15,
  };
}

/**
 * Penulisan baris materi — di sini tipe `Insert`/`Update` ditentukan
 * generated Database types, sehingga tidak ada cast pada hasil query.
 * Identitas stabil (module scope) agar tidak memicu effect di hook.
 */
const persist: NonNullable<
  Parameters<typeof useContentForm<MateriDraft, Materi>>[0]["persist"]
> = async ({ rowId, isEdit, userId, draft, managed }) => {
  const supabase = createClient();
  const body = { ...buildPayload(draft), ...managed };
  if (isEdit) {
    return await supabase.from("materi").update(body).eq("id", rowId);
  }
  return await supabase
    .from("materi")
    .insert({ ...body, id: rowId, created_by: userId });
};

export default function MateriFormModal({
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
  } = useContentForm<MateriDraft, Materi>({
    open,
    editing,
    bucket: "materi-images",
    logTag: "MateriFormModal",
    toDraft,
    isDirty: isDraftDirty,
    validate: validateDraft,
    persist,
    savedMessage: (isEdit) =>
      isEdit ? "Materi berhasil diperbarui." : "Materi baru berhasil dibuat.",
    nextSortOrder,
    onClose,
    onSaved,
    showToast,
  });

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
          <SaveFooter
            dirty={dirty}
            saving={saving}
            onCancel={requestClose}
            onSave={() => void handleSave()}
            testId="materi-modal-footer"
          />
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
              <PublishToggle
                value={draft.is_published}
                onChange={(v) => set("is_published", v)}
                hintOn="Materi terlihat oleh siswa"
                hintOff="Materi belum terlihat oleh siswa"
                disabled={saving}
              />
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
                      onChange={(e) => set("level", e.target.value)}
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
              <CoverField
                value={draft.image_url}
                alt={draft.title || "Cover materi"}
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

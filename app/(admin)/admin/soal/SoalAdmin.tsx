"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { ImageValidationError } from "@/lib/image/compressImage";
import {
  deleteStorageObject,
  deleteStoredImageByUrl,
  resolveStorageRef,
  uploadImageCompressed,
  type StorageRef,
} from "@/lib/image/storage";

type ExerciseOpt = { id: string; title: string; is_published: boolean };
type OptionRow = { id?: string; option_text: string; is_correct: boolean };
type QuestionRow = {
  id: string;
  question: string;
  explanation: string;
  points: number;
  sort_order: number;
  image_url: string | null;
  question_options: OptionRow[];
};

export function SoalAdmin({
  basePath = "/admin/soal",
}: {
  /** Rute halaman soal ini sendiri — panel guru memakai /guru/soal */
  basePath?: string;
}) {
  const search = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [exercises, setExercises] = useState<ExerciseOpt[]>([]);
  const [exerciseId, setExerciseId] = useState(search.get("ex") || "");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qText, setQText] = useState("");
  const [explanation, setExplanation] = useState("");
  const [points, setPoints] = useState(10);
  const [options, setOptions] = useState<OptionRow[]>([
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function loadExercises() {
    const supabase = createClient();
    const { data } = await supabase
      .from("exercises")
      .select("id, title, is_published")
      .order("created_at", { ascending: false });
    setExercises(data || []);
  }

  async function loadQuestions(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("id, question, explanation, points, sort_order, image_url, question_options(id, option_text, is_correct, sort_order)")
      .eq("exercise_id", id)
      .order("sort_order");
    if (error) showToast(error.message, "error");
    else setQuestions(data || []);
  }

  useEffect(() => {
    void loadExercises();
  }, []);

  useEffect(() => {
    if (exerciseId) void loadQuestions(exerciseId);
    else setQuestions([]);
  }, [exerciseId]);

  function openNew() {
    setEditingId(null);
    setQText("");
    setExplanation("");
    setPoints(10);
    setOptions([
      { option_text: "", is_correct: true },
      { option_text: "", is_correct: false },
    ]);
    setImageFile(null);
    setExistingImage(null);
    setRemoveImage(false);
    setOpen(true);
  }

  function openEdit(q: QuestionRow) {
    setEditingId(q.id);
    setQText(q.question);
    setExplanation(q.explanation || "");
    setPoints(q.points);
    setOptions(
      (q.question_options || []).length
        ? q.question_options.map((o) => ({
            id: o.id,
            option_text: o.option_text,
            is_correct: o.is_correct,
          }))
        : [
            { option_text: "", is_correct: true },
            { option_text: "", is_correct: false },
          ]
    );
    setExistingImage(q.image_url);
    setImageFile(null);
    setRemoveImage(false);
    setOpen(true);
  }

  /**
   * Pipeline gambar soal: kompres lokal dulu, upload hasil kompresinya.
   * Detail kompresi tidak pernah tampil di UI (implementation detail).
   */
  async function uploadProcessedImage(file: File, userId: string, questionId: string) {
    try {
      return await uploadImageCompressed(file, {
        bucket: "question-images",
        userId,
        entityKey: questionId,
      });
    } catch (err) {
      if (err instanceof ImageValidationError) {
        showToast(err.message, "error");
      } else {
        showToast("Gambar gagal diunggah. Silakan coba lagi.", "error");
        console.error("[SoalAdmin] upload gambar gagal:", err);
      }
      return null;
    }
  }

  async function save() {
    if (!exerciseId) return;
    if (!qText.trim()) {
      showToast("Teks soal wajib diisi", "error");
      return;
    }
    if (options.filter((o) => o.option_text.trim()).length < 2) {
      showToast("Minimal 2 pilihan", "error");
      return;
    }
    if (!options.some((o) => o.is_correct && o.option_text.trim())) {
      showToast("Tandai satu jawaban benar", "error");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const qId = editingId || crypto.randomUUID();
    let imageUrl = existingImage;
    // Path file BARU yang diupload sesi ini — dihapus bila insert/update DB
    // gagal agar tidak ada file orphan di storage.
    let newlyUploaded: StorageRef | null = null;
    // File LAMA hanya dihapus SETELAH DB update/insert berhasil.
    let oldImageRef: StorageRef | null = null;
    if (removeImage && imageUrl) {
      oldImageRef = resolveStorageRef(imageUrl);
      imageUrl = null;
    } else if (imageFile) {
      // URUTAN WAJIB: upload baru (terkompresi) dulu → baru ganti referensi DB.
      const uploaded = await uploadProcessedImage(imageFile, user.id, qId);
      if (!uploaded) return;
      oldImageRef = resolveStorageRef(existingImage);
      imageUrl = uploaded.publicUrl;
      newlyUploaded = { bucket: uploaded.bucket, path: uploaded.path };
    }

    const payload = {
      id: qId,
      exercise_id: exerciseId,
      question: qText.trim(),
      explanation: explanation.trim(),
      points,
      sort_order: editingId
        ? questions.find((q) => q.id === editingId)?.sort_order ?? questions.length
        : questions.length,
      image_url: imageUrl,
    };

    if (editingId) {
      const { error } = await supabase
        .from("questions")
        .update({
          question: payload.question,
          explanation: payload.explanation,
          points: payload.points,
          image_url: payload.image_url,
        })
        .eq("id", editingId);
      if (error) {
        // Orphan protection: upload sukses tapi DB gagal → hapus file baru.
        if (newlyUploaded) {
          const cleanupOk = await deleteStorageObject(newlyUploaded);
          if (!cleanupOk) {
            console.error("[SoalAdmin] orphan file perlu dibersihkan manual:", newlyUploaded);
          }
        }
        showToast(error.message, "error");
        return;
      }
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) {
        // Orphan protection: upload sukses tapi DB gagal → hapus file baru.
        if (newlyUploaded) {
          const cleanupOk = await deleteStorageObject(newlyUploaded);
          if (!cleanupOk) {
            console.error("[SoalAdmin] orphan file perlu dibersihkan manual:", newlyUploaded);
          }
        }
        showToast(error.message, "error");
        return;
      }
    }

    // DB sudah berhasil → baru aman menghapus file lama (jika diganti/dihapus).
    if (oldImageRef) {
      const ok = await deleteStorageObject(oldImageRef);
      if (!ok) {
        // Jangan rollback DB. Catat agar bisa dibersihkan (retryable).
        console.error("[SoalAdmin] gambar lama gagal dihapus (perlu retry manual):", oldImageRef);
      }
    }

    const { data: dbOptions } = await supabase
      .from("question_options")
      .select("id")
      .eq("question_id", qId);
    const dbIds = new Set((dbOptions || []).map((o) => o.id));
    const keep = new Set<string>();
    const cleaned = options.filter((o) => o.option_text.trim());
    for (let i = 0; i < cleaned.length; i++) {
      const o = cleaned[i];
      if (o.id && dbIds.has(o.id)) {
        keep.add(o.id);
        await supabase
          .from("question_options")
          .update({ option_text: o.option_text, is_correct: o.is_correct, sort_order: i })
          .eq("id", o.id);
      } else {
        const { data: inserted } = await supabase
          .from("question_options")
          .insert({
            question_id: qId,
            option_text: o.option_text,
            is_correct: o.is_correct,
            sort_order: i,
          })
          .select("id")
          .single();
        if (inserted) keep.add(inserted.id);
      }
    }
    const toDelete = [...dbIds].filter((id) => !keep.has(id));
    if (toDelete.length) await supabase.from("question_options").delete().in("id", toDelete);
    showToast(editingId ? "Soal diperbarui" : "Soal ditambahkan");
    setOpen(false);
    await loadQuestions(exerciseId);
  }

  async function move(id: string, dir: "up" | "down") {
    const idx = questions.findIndex((q) => q.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= questions.length) return;
    const supabase = createClient();
    await Promise.all([
      supabase.from("questions").update({ sort_order: swap }).eq("id", questions[idx].id),
      supabase.from("questions").update({ sort_order: idx }).eq("id", questions[swap].id),
    ]);
    await loadQuestions(exerciseId);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="px-3 py-2 rounded-xl border border-outline-variant min-w-64"
          value={exerciseId}
          onChange={(e) => {
            setExerciseId(e.target.value);
            router.replace(e.target.value ? `${basePath}?ex=${e.target.value}` : basePath);
          }}
        >
          <option value="">Pilih latihan...</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} — {e.is_published ? "Publik" : "Draft"}
            </option>
          ))}
        </select>
        {exerciseId ? (
          <button type="button" onClick={openNew} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold inline-flex gap-1">
            <Icon name="add" /> Tambah Soal
          </button>
        ) : null}
      </div>
      {!exerciseId ? (
        <p className="text-on-surface-variant">Pilih latihan untuk mengelola soal.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white border border-outline-variant rounded-2xl p-4">
              <div className="flex justify-between gap-3">
                <p className="font-semibold">
                  {i + 1}. {q.question}
                </p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => void move(q.id, "up")}>
                    <Icon name="arrow_upward" />
                  </button>
                  <button type="button" onClick={() => void move(q.id, "down")}>
                    <Icon name="arrow_downward" />
                  </button>
                  <button type="button" onClick={() => openEdit(q)}>
                    <Icon name="edit" />
                  </button>
                  <button type="button" onClick={() => setDeleteId(q.id)}>
                    <Icon name="delete" className="text-error" />
                  </button>
                </div>
              </div>
              <ul className="mt-2 text-sm space-y-1">
                {(q.question_options || []).map((o) => (
                  <li key={o.id} className={o.is_correct ? "text-primary font-bold" : ""}>
                    {o.is_correct ? "✓ " : ""}
                    {o.option_text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 bg-black/40 z-[80] overflow-y-auto p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl mx-auto my-8 space-y-3">
            <h3 className="font-bold">{editingId ? "Edit Soal" : "Tambah Soal"}</h3>
            <textarea className="w-full px-3 py-2 border rounded-xl" placeholder="Pertanyaan" value={qText} onChange={(e) => setQText(e.target.value)} />
            <textarea className="w-full px-3 py-2 border rounded-xl" placeholder="Penjelasan" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
            <input type="number" className="w-full px-3 py-2 border rounded-xl" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            {existingImage && !removeImage ? (
              <button type="button" className="text-sm text-error" onClick={() => setRemoveImage(true)}>
                Hapus gambar
              </button>
            ) : null}
            {options.map((o, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="radio"
                  name="correct"
                  checked={o.is_correct}
                  onChange={() =>
                    setOptions(options.map((opt, idx) => ({ ...opt, is_correct: idx === i })))
                  }
                />
                <input
                  className="flex-1 px-3 py-2 border rounded-xl"
                  placeholder={`Pilihan ${i + 1}`}
                  value={o.option_text}
                  onChange={(e) =>
                    setOptions(options.map((opt, idx) => (idx === i ? { ...opt, option_text: e.target.value } : opt)))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="text-sm font-bold text-primary"
              onClick={() => setOptions([...options, { option_text: "", is_correct: false }])}
            >
              + Pilihan
            </button>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)}>Batal</button>
              <button type="button" onClick={() => void save()} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold">
                Simpan Soal
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl">
            <p className="mb-4">Hapus soal?</p>
            <button type="button" className="mr-2" onClick={() => setDeleteId(null)}>Batal</button>
            <button
              type="button"
              className="bg-error text-white px-4 py-2 rounded-xl"
              onClick={async () => {
                // Hapus DB record dulu; storage menyusul hanya jika DB sukses.
                const supabase = createClient();
                const { error } = await supabase.from("questions").delete().eq("id", deleteId);
                if (error) {
                  showToast(error.message, "error");
                  setDeleteId(null);
                  return;
                }
                const q = questions.find((x) => x.id === deleteId);
                if (q?.image_url) {
                  const ok = await deleteStoredImageByUrl(q.image_url);
                  if (!ok) {
                    console.error("[SoalAdmin] gambar soal ybs gagal dihapus (perlu retry manual):", q.image_url);
                  }
                }
                setDeleteId(null);
                await loadQuestions(exerciseId);
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

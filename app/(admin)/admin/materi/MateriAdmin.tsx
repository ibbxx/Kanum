"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { Materi } from "@/lib/types";
import { ImageValidationError } from "@/lib/image/compressImage";
import {
  deleteStorageObject,
  deleteStoredImageByUrl,
  resolveStorageRef,
  uploadImageCompressed,
  type StorageRef,
} from "@/lib/image/storage";

const empty = {
  id: "",
  title: "",
  chapter_number: 1,
  level: "dasar" as Materi["level"],
  description: "",
  duration_minutes: 30,
  sort_order: 0,
  image_url: "",
  content_html: "",
  is_published: false,
};

export function MateriAdmin() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Materi[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // image_url saat form dibuka — acuan file lama yang boleh dihapus dari
  // storage HANYA setelah DB berhasil diperbarui.
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase.from("materi").select("*").order("sort_order");
    if (error) showToast(error.message, "error");
    else setRows((data || []) as Materi[]);
  }
  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!form.title.trim()) {
      showToast("Judul wajib diisi", "error");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const rowId = form.id || crypto.randomUUID();

    let imageUrl = form.image_url || null;
    let newlyUploaded: StorageRef | null = null;
    const oldImageRefs: StorageRef[] = [];
    const originalRef = resolveStorageRef(originalImageUrl);

    if (imageFile) {
      // URUTAN WAJIB: kompres lokal → upload baru dulu → baru ganti referensi DB.
      try {
        const uploaded = await uploadImageCompressed(imageFile, {
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
          console.error("[MateriAdmin] upload gambar gagal:", err);
        }
        return;
      }
    }
    if (originalRef && (!newlyUploaded || newlyUploaded.path !== originalRef.path)) {
      // File lama tak lagi direferensikan (diganti file baru / URL diubah).
      oldImageRefs.push(originalRef);
    }

    const payload = {
      title: form.title.trim(),
      chapter_number: Number(form.chapter_number) || 0,
      level: form.level,
      description: form.description,
      duration_minutes: Number(form.duration_minutes) || 30,
      sort_order: Number(form.sort_order) || 0,
      image_url: imageUrl,
      content_html: form.content_html,
      is_published: form.is_published,
    };
    let error;
    if (form.id) ({ error } = await supabase.from("materi").update(payload).eq("id", form.id));
    else ({ error } = await supabase.from("materi").insert({ ...payload, id: rowId, created_by: user.id }));

    if (error) {
      // Orphan protection: upload sukses tapi DB gagal → hapus file baru.
      if (newlyUploaded) {
        const ok = await deleteStorageObject(newlyUploaded);
        if (!ok) console.error("[MateriAdmin] orphan file perlu dibersihkan manual:", newlyUploaded);
      }
      showToast(error.message, "error");
      return;
    }

    // DB sudah berhasil → baru aman menghapus file lama (jika ada).
    for (const ref of oldImageRefs) {
      const ok = await deleteStorageObject(ref);
      if (!ok) console.error("[MateriAdmin] gambar lama gagal dihapus (perlu retry manual):", ref);
    }

    showToast("Materi disimpan");
    setOpen(false);
    setImageFile(null);
    await load();
  }

  return (
    <div>
      <button
        type="button"
        className="mb-4 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1"
        onClick={() => {
          setForm(empty);
          setImageFile(null);
          setOriginalImageUrl(null);
          setOpen(true);
        }}
      >
        <Icon name="add" /> Tambah Materi
      </button>
      <div className="bg-white border border-outline-variant rounded-2xl overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Bab</th>
              <th>Judul</th>
              <th>Level</th>
              <th>Durasi</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td className="text-center font-bold">{m.chapter_number || "–"}</td>
                <td>
                  <strong>{m.title}</strong>
                </td>
                <td>{m.level}</td>
                <td>{m.duration_minutes} min</td>
                <td>{m.is_published ? "Publik" : "Draft"}</td>
                <td className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        id: m.id,
                        title: m.title,
                        chapter_number: m.chapter_number,
                        level: m.level,
                        description: m.description,
                        duration_minutes: m.duration_minutes,
                        sort_order: m.sort_order,
                        image_url: m.image_url || "",
                        content_html: m.content_html,
                        is_published: m.is_published,
                      });
                      setImageFile(null);
                      setOriginalImageUrl(m.image_url || null);
                      setOpen(true);
                    }}
                  >
                    <Icon name="edit" />
                  </button>
                  <button type="button" onClick={() => setDeleteId(m.id)}>
                    <Icon name="delete" className="text-error" />
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold"
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.from("materi").update({ is_published: !m.is_published }).eq("id", m.id);
                      await load();
                    }}
                  >
                    {m.is_published ? "Nonaktif" : "Publish"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open ? (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">{form.id ? "Edit Materi" : "Tambah Materi"}</h3>
            <input className="w-full px-3 py-2 border rounded-xl" placeholder="Judul" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="px-3 py-2 border rounded-xl" placeholder="Bab" value={form.chapter_number} onChange={(e) => setForm({ ...form, chapter_number: Number(e.target.value) })} />
              <select className="px-3 py-2 border rounded-xl" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Materi["level"] })}>
                <option value="dasar">dasar</option>
                <option value="menengah">menengah</option>
                <option value="lanjut">lanjut</option>
              </select>
              <input type="number" className="px-3 py-2 border rounded-xl" placeholder="Durasi" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
              <input type="number" className="px-3 py-2 border rounded-xl" placeholder="Urutan" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            </div>
            <textarea className="w-full px-3 py-2 border rounded-xl" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <input className="w-full px-3 py-2 border rounded-xl" placeholder="URL gambar (opsional, untuk gambar eksternal)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <textarea className="w-full px-3 py-2 border rounded-xl min-h-40 font-mono text-sm" placeholder="Konten HTML" value={form.content_html} onChange={(e) => setForm({ ...form, content_html: e.target.value })} />
            <select className="w-full px-3 py-2 border rounded-xl" value={String(form.is_published)} onChange={(e) => setForm({ ...form, is_published: e.target.value === "true" })}>
              <option value="false">Draft</option>
              <option value="true">Dipublikasikan</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)}>Batal</button>
              <button type="button" onClick={() => void save()} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold">Simpan</button>
            </div>
          </div>
        </div>
      ) : null}
      {deleteId ? (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl">
            <p className="mb-4">Hapus materi?</p>
            <button type="button" className="mr-2" onClick={() => setDeleteId(null)}>Batal</button>
            <button
              type="button"
              className="bg-error text-white px-4 py-2 rounded-xl"
              onClick={async () => {
                // DB record dulu; storage menyusul hanya jika DB sukses.
                const supabase = createClient();
                const { error } = await supabase.from("materi").delete().eq("id", deleteId);
                if (error) {
                  showToast(error.message, "error");
                  setDeleteId(null);
                  return;
                }
                const row = rows.find((m) => m.id === deleteId);
                if (row?.image_url) {
                  const ok = await deleteStoredImageByUrl(row.image_url);
                  if (!ok) console.error("[MateriAdmin] gambar materi gagal dihapus (perlu retry manual):", row.image_url);
                }
                setDeleteId(null);
                await load();
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

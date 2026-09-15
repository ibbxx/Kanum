"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { Budaya } from "@/lib/types";
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
  topic_key: "",
  category: "Umum",
  description: "",
  image_url: "",
  content_html: "",
  is_published: false,
  sort_order: 0,
};

// Filter daftar budaya di sisi klien (referensi behavior: legacy
// filterBudaya — search judul/topic_key + status publikasi).
function filterBudaya(
  rows: Budaya[],
  q: string,
  status: "" | "true" | "false"
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // image_url saat form dibuka — acuan file lama yang boleh dihapus dari
  // storage HANYA setelah DB berhasil diperbarui.
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase.from("budaya").select("*").order("sort_order");
    if (error) showToast(error.message, "error");
    else setRows((data || []) as Budaya[]);
  }
  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!form.title.trim() || !form.topic_key.trim()) {
      showToast("Judul dan topic key wajib diisi", "error");
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const rowId = form.id || crypto.randomUUID();
    // Normalisasi topic_key seperti legacy: lowercase + spasi → strip.
    const topicKey = form.topic_key.trim().toLowerCase().replace(/\s+/g, "-");

    let imageUrl = form.image_url || null;
    let newlyUploaded: StorageRef | null = null;
    const oldImageRefs: StorageRef[] = [];
    const originalRef = resolveStorageRef(originalImageUrl);

    if (imageFile) {
      // URUTAN WAJIB: kompres lokal → upload baru dulu → baru ganti referensi DB.
      try {
        const uploaded = await uploadImageCompressed(imageFile, {
          bucket: "budaya-images",
          userId: user.id,
          entityKey: rowId,
        });
        imageUrl = uploaded.publicUrl;
        newlyUploaded = { bucket: uploaded.bucket, path: uploaded.path };
      } catch (err) {
        if (err instanceof ImageValidationError) showToast(err.message, "error");
        else {
          showToast("Gambar gagal diunggah. Silakan coba lagi.", "error");
          console.error("[BudayaAdmin] upload gambar gagal:", err);
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
      topic_key: topicKey,
      category: form.category || "Umum",
      description: form.description,
      image_url: imageUrl,
      content_html: form.content_html,
      is_published: form.is_published,
      sort_order: Number(form.sort_order) || 0,
    };
    let error;
    if (form.id) ({ error } = await supabase.from("budaya").update(payload).eq("id", form.id));
    else ({ error } = await supabase.from("budaya").insert({ ...payload, id: rowId, created_by: user.id }));

    if (error) {
      // Orphan protection: upload sukses tapi DB gagal → hapus file baru.
      if (newlyUploaded) {
        const ok = await deleteStorageObject(newlyUploaded);
        if (!ok) console.error("[BudayaAdmin] orphan file perlu dibersihkan manual:", newlyUploaded);
      }
      showToast(error.message, "error");
      return;
    }

    // DB sudah berhasil → baru aman menghapus file lama (jika ada).
    for (const ref of oldImageRefs) {
      const ok = await deleteStorageObject(ref);
      if (!ok) console.error("[BudayaAdmin] gambar lama gagal dihapus (perlu retry manual):", ref);
    }

    showToast("Budaya disimpan");
    setOpen(false);
    setImageFile(null);
    await load();
  }

  return (
    <div>
      <button
        type="button"
        className="mb-4 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold inline-flex gap-1 items-center"
        onClick={() => {
          setForm(empty);
          setImageFile(null);
          setOriginalImageUrl(null);
          setOpen(true);
        }}
        data-testid="add-budaya"
      >
        <Icon name="add" /> Tambah Budaya
      </button>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className="px-3 py-2 border border-outline-variant rounded-xl bg-white text-sm max-w-64"
          placeholder="Cari judul atau key..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-outline-variant rounded-xl bg-white text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "true" | "false")}
        >
          <option value="">Semua Status</option>
          <option value="true">Dipublikasikan</option>
          <option value="false">Draft</option>
        </select>
      </div>
      <div className="bg-white border border-outline-variant rounded-2xl overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Key</th>
              <th>Kategori</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filterBudaya(rows, query, statusFilter).map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.title}</strong>
                  {b.description ? (
                    <span className="block text-xs text-on-surface-variant">
                      {b.description.length > 60 ? b.description.slice(0, 60) + "..." : b.description}
                    </span>
                  ) : null}
                </td>
                <td>
                  <code className="text-xs bg-surface-container-low px-1.5 py-0.5 rounded">{b.topic_key}</code>
                </td>
                <td>{b.category}</td>
                <td>{b.is_published ? "Publik" : "Draft"}</td>
                <td className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        id: b.id,
                        title: b.title,
                        topic_key: b.topic_key,
                        category: b.category,
                        description: b.description,
                        image_url: b.image_url || "",
                        content_html: b.content_html,
                        is_published: b.is_published,
                        sort_order: b.sort_order,
                      });
                      setImageFile(null);
                      setOriginalImageUrl(b.image_url || null);
                      setOpen(true);
                    }}
                  >
                    <Icon name="edit" />
                  </button>
                  <button type="button" onClick={() => setDeleteId(b.id)}>
                    <Icon name="delete" className="text-error" />
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold"
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.from("budaya").update({ is_published: !b.is_published }).eq("id", b.id);
                      await load();
                    }}
                  >
                    {b.is_published ? "Nonaktif" : "Publish"}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-on-surface-variant">
                  Belum ada konten budaya. Klik "Tambah Budaya" untuk membuat.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {open ? (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl my-8 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">{form.id ? "Edit Budaya" : "Tambah Budaya"}</h3>
            <input className="w-full px-3 py-2 border rounded-xl" placeholder="Judul" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="w-full px-3 py-2 border rounded-xl" placeholder="topic_key (unik)" value={form.topic_key} onChange={(e) => setForm({ ...form, topic_key: e.target.value })} />
            <input className="w-full px-3 py-2 border rounded-xl" placeholder="Kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <textarea className="w-full px-3 py-2 border rounded-xl" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            <input className="w-full px-3 py-2 border rounded-xl" placeholder="URL gambar (opsional, untuk gambar eksternal)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <textarea className="w-full px-3 py-2 border rounded-xl min-h-40 font-mono text-sm" placeholder="Konten HTML" value={form.content_html} onChange={(e) => setForm({ ...form, content_html: e.target.value })} />
            <input type="number" className="w-full px-3 py-2 border rounded-xl" placeholder="Urutan" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
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
            <p className="mb-4">
              Hapus konten budaya <strong>{rows.find((b) => b.id === deleteId)?.title}</strong>?
            </p>
            <button type="button" className="mr-2" onClick={() => setDeleteId(null)}>Batal</button>
            <button
              type="button"
              className="bg-error text-white px-4 py-2 rounded-xl"
              onClick={async () => {
                // DB record dulu; storage menyusul hanya jika DB sukses.
                const supabase = createClient();
                const { error } = await supabase.from("budaya").delete().eq("id", deleteId);
                if (error) {
                  showToast(error.message, "error");
                  setDeleteId(null);
                  return;
                }
                const row = rows.find((b) => b.id === deleteId);
                if (row?.image_url) {
                  const ok = await deleteStoredImageByUrl(row.image_url);
                  if (!ok) console.error("[BudayaAdmin] gambar budaya gagal dihapus (perlu retry manual):", row.image_url);
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

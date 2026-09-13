"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { Budaya } from "@/lib/types";

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

export function BudayaAdmin() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Budaya[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    const payload = {
      title: form.title.trim(),
      topic_key: form.topic_key.trim(),
      category: form.category || "Umum",
      description: form.description,
      image_url: form.image_url || null,
      content_html: form.content_html,
      is_published: form.is_published,
      sort_order: Number(form.sort_order) || 0,
    };
    let error;
    if (form.id) ({ error } = await supabase.from("budaya").update(payload).eq("id", form.id));
    else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      ({ error } = await supabase.from("budaya").insert({ ...payload, created_by: user?.id }));
    }
    if (error) showToast(error.message, "error");
    else {
      showToast("Budaya disimpan");
      setOpen(false);
      await load();
    }
  }

  return (
    <div>
      <button
        type="button"
        className="mb-4 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold inline-flex gap-1 items-center"
        onClick={() => {
          setForm(empty);
          setOpen(true);
        }}
      >
        <Icon name="add" /> Tambah Budaya
      </button>
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
            {rows.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.title}</strong>
                </td>
                <td>{b.topic_key}</td>
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
            <input className="w-full px-3 py-2 border rounded-xl" placeholder="URL gambar" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
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
            <p className="mb-4">Hapus konten budaya?</p>
            <button type="button" className="mr-2" onClick={() => setDeleteId(null)}>Batal</button>
            <button
              type="button"
              className="bg-error text-white px-4 py-2 rounded-xl"
              onClick={async () => {
                const supabase = createClient();
                await supabase.from("budaya").delete().eq("id", deleteId);
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

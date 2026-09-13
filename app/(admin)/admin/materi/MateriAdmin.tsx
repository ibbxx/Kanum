"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { Materi } from "@/lib/types";

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
    const payload = {
      title: form.title.trim(),
      chapter_number: Number(form.chapter_number) || 0,
      level: form.level,
      description: form.description,
      duration_minutes: Number(form.duration_minutes) || 30,
      sort_order: Number(form.sort_order) || 0,
      image_url: form.image_url || null,
      content_html: form.content_html,
      is_published: form.is_published,
    };
    let error;
    if (form.id) ({ error } = await supabase.from("materi").update(payload).eq("id", form.id));
    else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      ({ error } = await supabase.from("materi").insert({ ...payload, created_by: user?.id }));
    }
    if (error) showToast(error.message, "error");
    else {
      showToast("Materi disimpan");
      setOpen(false);
      await load();
    }
  }

  return (
    <div>
      <button
        type="button"
        className="mb-4 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1"
        onClick={() => {
          setForm(empty);
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
            <input className="w-full px-3 py-2 border rounded-xl" placeholder="URL gambar" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
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
                const supabase = createClient();
                await supabase.from("materi").delete().eq("id", deleteId);
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

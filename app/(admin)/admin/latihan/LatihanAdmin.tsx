"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { Exercise } from "@/lib/types";

type Row = Exercise & { questions?: { id: string }[] };

const emptyForm = {
  id: "",
  title: "",
  description: "",
  category: "",
  difficulty: "Sedang" as Exercise["difficulty"],
  time_limit: 30,
  passing_score: 70,
  is_published: false,
};

export function LatihanAdmin({
  basePath = "/admin",
}: {
  /** Base rute soal — panel guru memakai /guru */
  basePath?: string;
}) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("exercises")
      .select("id, title, category, difficulty, is_published, time_limit, passing_score, description, questions(id)")
      .order("created_at", { ascending: false });
    if (error) showToast("Gagal memuat: " + error.message, "error");
    else setRows((data || []) as Row[]);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = rows.filter((e) => {
    const matchQ =
      !q ||
      e.title.toLowerCase().includes(q.toLowerCase()) ||
      (e.category || "").toLowerCase().includes(q.toLowerCase());
    const matchS = status === "" || String(e.is_published) === status;
    return matchQ && matchS;
  });

  async function save() {
    if (!form.title.trim()) {
      showToast("Judul wajib diisi", "error");
      return;
    }
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || "Umum",
      difficulty: form.difficulty,
      time_limit: Number(form.time_limit) || 0,
      passing_score: Number(form.passing_score) || 70,
      is_published: form.is_published,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from("exercises").update(payload).eq("id", form.id));
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      ({ error } = await supabase.from("exercises").insert({ ...payload, created_by: user?.id }));
    }
    if (error) showToast("Gagal menyimpan: " + error.message, "error");
    else {
      showToast(form.id ? "Latihan diperbarui" : "Latihan ditambahkan");
      setOpen(false);
      await load();
    }
  }

  async function toggle(id: string, current: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("exercises").update({ is_published: !current }).eq("id", id);
    if (error) showToast(error.message, "error");
    else await load();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const supabase = createClient();
    const { error } = await supabase.from("exercises").delete().eq("id", deleteId);
    if (error) showToast(error.message, "error");
    else {
      showToast("Latihan dihapus");
      setDeleteId(null);
      await load();
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="flex-1 min-w-48 px-3 py-2 rounded-xl border border-outline-variant"
          placeholder="Cari latihan..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="px-3 py-2 rounded-xl border border-outline-variant"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Semua status</option>
          <option value="true">Dipublikasikan</option>
          <option value="false">Draft</option>
        </select>
        <button
          type="button"
          className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1"
          onClick={() => {
            setForm(emptyForm);
            setOpen(true);
          }}
        >
          <Icon name="add" /> Tambah Latihan
        </button>
      </div>
      <div className="bg-white border border-outline-variant rounded-2xl overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Kategori</th>
              <th>Soal</th>
              <th>Kesulitan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-on-surface-variant">
                  Belum ada latihan.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.title}</strong>
                    <br />
                    <span className="text-xs text-on-surface-variant">
                      {(e.description || "").slice(0, 60)}
                    </span>
                  </td>
                  <td>{e.category}</td>
                  <td className="text-center font-bold">{e.questions?.length ?? 0}</td>
                  <td>{e.difficulty}</td>
                  <td>{e.is_published ? "Dipublikasikan" : "Draft"}</td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`${basePath}/soal?ex=${e.id}`} className="text-sm font-bold text-primary">
                        Soal
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            id: e.id,
                            title: e.title,
                            description: e.description,
                            category: e.category,
                            difficulty: e.difficulty,
                            time_limit: e.time_limit,
                            passing_score: e.passing_score,
                            is_published: e.is_published,
                          });
                          setOpen(true);
                        }}
                      >
                        <Icon name="edit" className="text-[18px]" />
                      </button>
                      <button type="button" onClick={() => setDeleteId(e.id)}>
                        <Icon name="delete" className="text-[18px] text-error" />
                      </button>
                      <button type="button" onClick={() => void toggle(e.id, e.is_published)} className="text-xs font-bold">
                        {e.is_published ? "Nonaktif" : "Publish"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4">{form.id ? "Edit Latihan" : "Tambah Latihan"}</h3>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 border rounded-xl" placeholder="Judul" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="w-full px-3 py-2 border rounded-xl" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input className="w-full px-3 py-2 border rounded-xl" placeholder="Kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <select className="w-full px-3 py-2 border rounded-xl" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as Exercise["difficulty"] })}>
                <option>Mudah</option>
                <option>Sedang</option>
                <option>Sulit</option>
              </select>
              <input type="number" className="w-full px-3 py-2 border rounded-xl" placeholder="Batas waktu (menit)" value={form.time_limit} onChange={(e) => setForm({ ...form, time_limit: Number(e.target.value) })} />
              <input type="number" className="w-full px-3 py-2 border rounded-xl" placeholder="Nilai lulus" value={form.passing_score} onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })} />
              <select className="w-full px-3 py-2 border rounded-xl" value={String(form.is_published)} onChange={(e) => setForm({ ...form, is_published: e.target.value === "true" })}>
                <option value="false">Draft</option>
                <option value="true">Dipublikasikan</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setOpen(false)}>Batal</button>
              <button type="button" onClick={() => void save()} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold">
                Simpan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm">
            <p className="mb-4">Hapus latihan ini?</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteId(null)}>Batal</button>
              <button type="button" onClick={() => void confirmDelete()} className="bg-error text-white px-4 py-2 rounded-xl">
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import type { UserRole } from "@/lib/types";

type Akun = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  class_name: string;
  created_at: string;
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  teacher: "Guru",
  student: "Siswa",
};

export function KelolaAkun() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Akun[]>([]);
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<{ akun: Akun; role: UserRole } | null>(null);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, class_name, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      showToast("Gagal memuat akun: " + error.message, "error");
      return;
    }
    setRows((data || []) as Akun[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function changeRole() {
    if (!pending) return;
    const { akun, role } = pending;
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", akun.id);
    if (error) {
      showToast("Gagal mengubah role: " + error.message, "error");
      return;
    }
    showToast(`${akun.full_name} → ${ROLE_LABEL[role]}`);
    setPending(null);
    await load();
  }

  const filtered = rows.filter(
    (a) =>
      !q ||
      a.full_name.toLowerCase().includes(q.toLowerCase()) ||
      a.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <p className="text-sm text-on-surface-variant mb-4">
        Ubah role pengguna. Hati-hati: admin punya akses penuh ke semua data &amp;
        akun.
      </p>
      <input
        className="w-full sm:w-72 px-3 py-2 rounded-xl border border-outline-variant mb-4"
        placeholder="Cari nama atau email..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="bg-white border border-outline-variant rounded-2xl overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ubah Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-on-surface-variant">
                  Tidak ada akun cocok.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.full_name || "—"}</strong>
                  </td>
                  <td>{a.email}</td>
                  <td>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        a.role === "admin"
                          ? "bg-error-container text-on-error-container"
                          : a.role === "teacher"
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {ROLE_LABEL[a.role] ?? a.role}
                    </span>
                  </td>
                  <td>
                    <select
                      className="px-2 py-1.5 rounded-xl border border-outline-variant text-sm"
                      value={a.role}
                      onChange={(e) =>
                        setPending({ akun: a, role: e.target.value as UserRole })
                      }
                    >
                      <option value="student">Siswa</option>
                      <option value="teacher">Guru</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pending ? (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm">
            <h3 className="font-bold mb-2">Ubah role akun?</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              <strong>{pending.akun.full_name}</strong> ({pending.akun.email}) akan
              menjadi <strong>{ROLE_LABEL[pending.role]}</strong>
              {pending.role === "admin"
                ? " dengan akses penuh ke seluruh data."
                : pending.role === "teacher"
                  ? " dengan panel pengelolaan kelas & konten di /guru."
                  : "."}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)}>
                Batal
              </button>
              <button
                type="button"
                onClick={() => void changeRole()}
                className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold"
              >
                Ya, Ubah
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

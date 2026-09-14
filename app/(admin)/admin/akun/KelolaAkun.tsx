"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import type { UserRole } from "@/lib/types";

type Akun = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: string;
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
  const [hapus, setHapus] = useState<Akun | null>(null);

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status, class_name, created_at")
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
    // RPC admin_set_role: satu-satunya jalur ubah role (client tidak punya
    // privilege UPDATE kolom role/status). Role dari admin = approved.
    const { error } = await supabase.rpc("admin_set_role", {
      p_user_id: akun.id,
      p_role: role,
    });
    if (error) {
      showToast("Gagal mengubah role: " + error.message, "error");
      return;
    }
    showToast(`${akun.full_name} → ${ROLE_LABEL[role]}`);
    setPending(null);
    await load();
  }

  async function deleteAkun() {
    if (!hapus) return;
    const supabase = createClient();
    // RPC admin_delete_account: hapus auth user + semua data terkait.
    // DB menolak bila: bukan admin, akun sendiri, atau admin terakhir.
    const { error } = await supabase.rpc("admin_delete_account", {
      p_user_id: hapus.id,
    });
    if (error) {
      showToast("Gagal menghapus: " + error.message, "error");
      return;
    }
    showToast(`Akun ${hapus.full_name || hapus.email} dihapus`);
    setHapus(null);
    await load();
  }

  const filtered = rows.filter(
    (a) =>
      !q ||
      a.full_name.toLowerCase().includes(q.toLowerCase()) ||
      a.email.toLowerCase().includes(q.toLowerCase())
  );

  // UX-only guard: backend (Supabase/008_admin_guard.sql) tetap
  // otoritatif — bila dilewati, DB menolak dan pesannya ditampilkan.
  const approvedAdminCount = rows.filter(
    (a) => a.role === "admin" && a.status === "approved"
  ).length;
  const isLastApprovedAdmin = (a: Akun) =>
    approvedAdminCount <= 1 && a.role === "admin" && a.status === "approved";

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
              <th>Hapus</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-on-surface-variant">
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
                    {a.status === "pending" && (
                      <span className="ml-1.5 inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-secondary-container text-on-secondary-container">
                        Menunggu
                      </span>
                    )}
                    {a.status === "rejected" && (
                      <span className="ml-1.5 inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-error-container text-on-error-container">
                        Ditolak
                      </span>
                    )}
                  </td>
                  <td>
                    <select
                      className="px-2 py-1.5 rounded-xl border border-outline-variant text-sm disabled:opacity-50"
                      value={a.role}
                      disabled={isLastApprovedAdmin(a)}
                      title={
                        isLastApprovedAdmin(a)
                          ? "Admin terakhir tidak dapat diturunkan atau dihapus."
                          : undefined
                      }
                      onChange={(e) =>
                        setPending({ akun: a, role: e.target.value as UserRole })
                      }
                    >
                      <option value="student">Siswa</option>
                      <option value="teacher">Guru</option>
                      <option value="admin">Admin</option>
                    </select>
                    {isLastApprovedAdmin(a) && (
                      <p className="mt-1 max-w-48 text-[10px] text-on-surface-variant">
                        Admin terakhir tidak dapat diturunkan atau dihapus.
                      </p>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={isLastApprovedAdmin(a)}
                      title={
                        isLastApprovedAdmin(a)
                          ? "Admin terakhir tidak dapat dihapus atau diturunkan. Sistem harus memiliki minimal satu admin."
                          : "Hapus akun ini"
                      }
                      className="text-error hover:opacity-70 p-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => setHapus(a)}
                    >
                      <Icon name="delete" className="text-[18px]" />
                    </button>
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
            {isLastApprovedAdmin(pending.akun) &&
              pending.role !== "admin" && (
              <p className="text-xs mb-4 px-3 py-2 rounded-xl bg-error-container text-on-error-container">
                Admin terakhir tidak dapat dihapus atau diturunkan. Sistem harus memiliki minimal satu admin.
              </p>
            )}
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

      {hapus ? (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm">
            <h3 className="font-bold mb-2 text-error">Hapus akun ini?</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              <strong>{hapus.full_name || "—"}</strong> ({hapus.email}) akan
              dihapus permanen bersama seluruh datanya: keanggotaan kelas,
              progres &amp; riwayat latihan.
              {hapus.role === "admin" &&
                " Akun ini ADMIN — sistem membutuhkan minimal satu admin, jadi penghapusan bisa ditolak."}
            </p>
            <p className="text-xs text-on-surface-variant mb-4">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setHapus(null)}>
                Batal
              </button>
              <button
                type="button"
                onClick={() => void deleteAkun()}
                className="bg-error text-on-error px-4 py-2 rounded-xl font-bold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

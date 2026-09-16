"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

export type Pengajuan = {
  id: string;
  full_name: string;
  email: string;
  class_name: string;
  role: string;
  status: string;
  avatar_url: string | null;
  created_at: string;
};

const ROLE_LABEL: Record<string, string> = {
  student: "Siswa",
  teacher: "Guru",
  admin: "Admin",
};

/**
 * Daftar pengajuan akun pending + aksi setujui/tolak.
 * Authority ditentukan RPC set_verification_status di database
 * (guru → siswa, admin → semua); UI hanya mengirimkan permintaan.
 */
export function VerifikasiPanel() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Pengajuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("list_verification_queue");
    setLoading(false);
    if (error) {
      showToast("Gagal memuat pengajuan: " + error.message, "error");
      return;
    }
    setRows(data || []);
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(p: Pengajuan, status: "approved" | "rejected") {
    setBusyId(p.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("set_verification_status", {
      p_user_id: p.id,
      p_status: status,
    });
    setBusyId(null);
    if (error) {
      showToast("Gagal: " + error.message, "error");
      return;
    }
    showToast(
      status === "approved"
        ? `${p.full_name} disetujui sebagai ${ROLE_LABEL[p.role] ?? p.role}`
        : `Pengajuan ${p.full_name} ditolak`
    );
    await load();
  }

  if (loading) {
    return (
      <p className="text-sm text-on-surface-variant py-8 text-center">Memuat pengajuan...</p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-outline-variant rounded-2xl py-12 text-center">
        <Icon name="task_alt" className="text-[40px] text-on-surface-variant mb-2" />
        <p className="text-sm text-on-surface-variant">
          Tidak ada pengajuan akun yang menunggu verifikasi.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-2xl overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Kelas</th>
            <th>Daftar Sebagai</th>
            <th>Tanggal</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td>
                <strong>{p.full_name || "—"}</strong>
              </td>
              <td>{p.email}</td>
              <td>{p.class_name || "–"}</td>
              <td>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    p.role === "teacher"
                      ? "bg-tertiary-container text-on-tertiary-container"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {ROLE_LABEL[p.role] ?? p.role}
                </span>
              </td>
              <td className="whitespace-nowrap">
                {new Date(p.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => void decide(p, "approved")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold disabled:opacity-50"
                  >
                    <Icon name="check" className="text-[14px]" />
                    Setujui
                  </button>
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => void decide(p, "rejected")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-error-container text-on-error-container text-xs font-bold disabled:opacity-50"
                  >
                    <Icon name="close" className="text-[14px]" />
                    Tolak
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

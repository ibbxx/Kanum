"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

type Kelas = { id: string; name: string; created_at: string };
type Anggota = {
  student_id: string;
  profiles: { full_name: string; email: string; class_name: string } | null;
};

export function KelasGuru() {
  const { showToast } = useToast();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [anggota, setAnggota] = useState<Anggota[]>([]);
  const [namaKelas, setNamaKelas] = useState("");
  const [emailSiswa, setEmailSiswa] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadKelas() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      showToast("Gagal memuat kelas: " + error.message, "error");
      return;
    }
    setKelasList((data || []) as Kelas[]);
    setActiveId((prev) => prev ?? (data as Kelas[] | null)?.[0]?.id ?? null);
  }

  async function loadAnggota(classId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("class_members")
      .select("student_id, profiles(full_name, email, class_name)")
      .eq("class_id", classId)
      .order("enrolled_at", { ascending: false });
    if (error) {
      showToast("Gagal memuat anggota: " + error.message, "error");
      return;
    }
    setAnggota((data || []) as unknown as Anggota[]);
  }

  useEffect(() => {
    void loadKelas();
  }, []);

  useEffect(() => {
    if (activeId) void loadAnggota(activeId);
  }, [activeId]);

  async function buatKelas() {
    if (!namaKelas.trim()) {
      showToast("Nama kelas wajib diisi", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("classes")
      .insert({ name: namaKelas.trim(), teacher_id: user?.id });
    setLoading(false);
    if (error) {
      showToast("Gagal membuat kelas: " + error.message, "error");
      return;
    }
    showToast("Kelas dibuat");
    setNamaKelas("");
    await loadKelas();
  }

  async function tambahSiswa() {
    if (!activeId) return;
    if (!emailSiswa.trim()) {
      showToast("Isi email siswa", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // Cari siswa by email — hanya akun student yang SUDAH disetujui.
    // RLS "Guru lihat profil siswa" mengizinkan guru melihat profil siswa.
    const { data: profil, error: errCari } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("email", emailSiswa.trim().toLowerCase())
      .eq("role", "student")
      .eq("status", "approved")
      .maybeSingle();

    if (errCari || !profil) {
      setLoading(false);
      showToast(
        "Siswa tidak ditemukan. Pastikan email benar dan sudah mendaftar sebagai siswa.",
        "error"
      );
      return;
    }

    const { error } = await supabase
      .from("class_members")
      .insert({ class_id: activeId, student_id: profil.id });

    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        showToast("Siswa sudah terdaftar di kelas ini", "error");
      } else {
        showToast("Gagal menambah: " + error.message, "error");
      }
      return;
    }
    showToast(`${profil.full_name} ditambahkan ke kelas`);
    setEmailSiswa("");
    await loadAnggota(activeId);
  }

  async function hapusAnggota(studentId: string) {
    if (!activeId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("class_members")
      .delete()
      .eq("class_id", activeId)
      .eq("student_id", studentId);
    if (error) {
      showToast("Gagal menghapus: " + error.message, "error");
      return;
    }
    showToast("Siswa dikeluarkan dari kelas");
    await loadAnggota(activeId);
  }

  async function hapusKelas(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) {
      showToast("Gagal menghapus kelas: " + error.message, "error");
      return;
    }
    showToast("Kelas dihapus");
    setActiveId(null);
    setAnggota([]);
    await loadKelas();
  }

  const activeKelas = kelasList.find((k) => k.id === activeId);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Kolom daftar kelas */}
      <div className="space-y-4">
        <div className="bg-white border border-outline-variant rounded-2xl p-4">
          <h3 className="font-bold mb-3">Buat Kelas Baru</h3>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border border-outline-variant rounded-xl"
              placeholder="Contoh: 8A"
              value={namaKelas}
              onChange={(e) => setNamaKelas(e.target.value)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void buatKelas()}
              className="bg-primary text-on-primary px-3 py-2 rounded-xl font-bold inline-flex items-center gap-1"
            >
              <Icon name="add" /> Buat
            </button>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-2xl p-2">
          {kelasList.length === 0 ? (
            <p className="text-center text-sm text-on-surface-variant py-6">
              Belum ada kelas. Buat dulu di atas.
            </p>
          ) : (
            kelasList.map((k) => (
              <div
                key={k.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${
                  k.id === activeId ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-container-low"
                }`}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 font-semibold text-sm"
                  onClick={() => setActiveId(k.id)}
                >
                  <Icon name="groups" className="text-[18px]" />
                  {k.name}
                </button>
                <button
                  type="button"
                  onClick={() => void hapusKelas(k.id)}
                  title="Hapus kelas"
                >
                  <Icon name="delete" className="text-[18px] text-error" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Kolom anggota */}
      <div className="space-y-4">
        <div className="bg-white border border-outline-variant rounded-2xl p-4">
          <h3 className="font-bold mb-1">
            {activeKelas ? `Anggota Kelas ${activeKelas.name}` : "Anggota Kelas"}
          </h3>
          <p className="text-xs text-on-surface-variant mb-3">
            Tambah siswa dengan email yang terdaftar. Siswa harus sudah
            mendaftar DAN sudah disetujui verifikasi.
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border border-outline-variant rounded-xl"
              placeholder="email-siswa@contoh.com"
              type="email"
              value={emailSiswa}
              onChange={(e) => setEmailSiswa(e.target.value)}
            />
            <button
              type="button"
              disabled={loading || !activeId}
              onClick={() => void tambahSiswa()}
              className="bg-primary text-on-primary px-3 py-2 rounded-xl font-bold inline-flex items-center gap-1"
            >
              <Icon name="person_add" /> Tambah
            </button>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-2xl overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Kelas (teks)</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!activeId ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-on-surface-variant">
                    Pilih kelas terlebih dahulu.
                  </td>
                </tr>
              ) : anggota.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-on-surface-variant">
                    Belum ada siswa di kelas ini.
                  </td>
                </tr>
              ) : (
                anggota.map((a) => (
                  <tr key={a.student_id}>
                    <td>
                      <strong>{a.profiles?.full_name || "—"}</strong>
                    </td>
                    <td>{a.profiles?.email || "—"}</td>
                    <td>{a.profiles?.class_name || "–"}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => void hapusAnggota(a.student_id)}
                      >
                        <Icon name="person_remove" className="text-[18px] text-error" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

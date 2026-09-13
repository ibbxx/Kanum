"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export function RegisterForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"siswa" | "guru">("siswa");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast("Lengkapi semua kolom", "error");
      return;
    }
    if (password !== confirm) {
      showToast("Kata sandi tidak cocok", "error");
      return;
    }
    if (!terms) {
      showToast("Setujui syarat & ketentuan terlebih dahulu", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role === "guru" ? "teacher" : "student",
        },
      },
    });
    setLoading(false);
    if (error) {
      showToast("Gagal daftar: " + error.message, "error");
      return;
    }
    showToast(
      role === "guru"
        ? "Akun guru berhasil dibuat! Cek email untuk verifikasi."
        : "Akun berhasil dibuat! Silakan cek email untuk verifikasi."
    );
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-on-surface-variant">
          ← Beranda
        </Link>
        <h1 className="font-display text-3xl font-extrabold mt-6 mb-2">Daftar</h1>
        <p className="text-on-surface-variant text-sm mb-8">Buat akun KANUM baru.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
            placeholder="Nama lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
            type="password"
            placeholder="Kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
            type="password"
            placeholder="Ulangi kata sandi"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={role === "siswa"}
                onChange={() => setRole("siswa")}
              />
              Siswa
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={role === "guru"}
                onChange={() => setRole("guru")}
              />
              Guru
            </label>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>
              Saya setuju dengan{" "}
              <Link href="/terms" className="text-primary underline">
                Syarat & Ketentuan
              </Link>{" "}
              dan{" "}
              <Link href="/privacy" className="text-primary underline">
                Kebijakan Privasi
              </Link>
              .
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl"
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
        </form>
        <p className="text-center text-sm mt-6 text-on-surface-variant">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-bold">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

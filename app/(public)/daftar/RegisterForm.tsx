"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { homePathForRole, resolveUserRole } from "@/lib/auth";

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
    if (password.length < 6) {
      showToast("Kata sandi minimal 6 karakter", "error");
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          full_name: name,
          role, // "siswa" | "guru" — trigger DB memetakan guru → 'teacher'
        },
      },
    });
    if (error) {
      setLoading(false);
      const isRateLimited =
        error.code === "over_email_send_rate_limit" ||
        error.message.toLowerCase().includes("rate limit");
      if (isRateLimited) {
        // Akun tetap terbentuk — hanya email verifikasinya yang tertunda.
        // Arahkan ke /cek-email supaya user bisa kirim ulang lewat tombol resend.
        showToast(
          "Akun dibuat, tapi email verifikasi tertunda. Kirim ulang di halaman berikutnya.",
          "error"
        );
        router.push(`/cek-email?email=${encodeURIComponent(email)}`);
        return;
      }
      showToast("Gagal daftar: " + error.message, "error");
      return;
    }
    if (data.session && data.user) {
      const dbRole = await resolveUserRole(supabase, data.user.id);
      window.location.assign(homePathForRole(dbRole));
      return;
    }
    setLoading(false);
    router.push(`/cek-email?email=${encodeURIComponent(email)}`);
  }

  async function googleSignup() {
    const supabase = createClient();
    // Simpan pilihan role — diterapkan oleh /auth/oauth-role setelah OAuth kembali.
    document.cookie = `kanum-oauth-role=${
      role === "guru" ? "teacher" : "student"
    }; path=/; max-age=1800; samesite=lax`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/oauth-role`,
      },
    });
    if (error) showToast("Gagal: " + error.message, "error");
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
          <p className="text-xs text-on-surface-variant">
            Siswa masuk ke dashboard belajar. Guru mendapat panel pengelolaan kelas &amp;
            konten sendiri di /guru.
          </p>
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
        <div className="relative my-5 flex items-center">
          <div className="flex-grow h-px bg-outline-variant/40" />
          <span className="px-3 text-outline text-[11px]">ATAU</span>
          <div className="flex-grow h-px bg-outline-variant/40" />
        </div>
        <button
          type="button"
          onClick={googleSignup}
          className="w-full border border-outline-variant py-3 rounded-xl font-semibold"
        >
          Daftar dengan Google
        </button>
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

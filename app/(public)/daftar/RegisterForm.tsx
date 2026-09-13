"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { AuthBrandPanel } from "@/components/layout/AuthBrandPanel";
import { homePathForRole, resolveUserRole } from "@/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Gagal mendaftar dengan Google. Coba lagi.",
};

function RegisterFormInner() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"siswa" | "guru">("siswa");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const errorCode = searchParams.get("error");
  const bannerMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? "Terjadi kesalahan. Coba lagi."
    : null;

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
      const msg = error.message.toLowerCase();
      const isRateLimited =
        error.code === "over_email_send_rate_limit" ||
        msg.includes("rate limit");
      if (isRateLimited) {
        // 429: akun tetap terbentuk — hanya email verifikasinya yang tertunda.
        // Arahkan ke /cek-email supaya user bisa kirim ulang lewat tombol resend.
        showToast(
          "Akun dibuat, tapi email verifikasi tertunda. Kirim ulang di halaman berikutnya.",
          "error"
        );
        window.location.assign(`/cek-email?email=${encodeURIComponent(email)}`);
        return;
      }
      if (
        error.code === "unexpected_failure" ||
        msg.includes("error sending confirmation email")
      ) {
        // 500 dari Supabase: pengiriman email verifikasi gagal di sisi SMTP.
        // Akun BELUM terbentuk — jangan arahkan ke /cek-email (resend tak akan temukan akun).
        showToast(
          "Server email sedang bermasalah. Pendaftaran gagal — coba lagi beberapa saat.",
          "error"
        );
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
    window.location.assign(`/cek-email?email=${encodeURIComponent(email)}`);
  }

  async function googleSignup() {
    const supabase = createClient();
    // Simpan pilihan role — diterapkan oleh /auth/oauth-role setelah OAuth kembali.
    document.cookie = `kanum-oauth-role=${
      role === "guru" ? "teacher" : "student"
    }; path=/; max-age=1800; samesite=lax`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/oauth-role`,
      },
    });
    if (error) showToast("Gagal: " + error.message, "error");
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-surface-container-lowest">
      <AuthBrandPanel />

      <main className="relative flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
        <Link
          href="/"
          className="lg:hidden absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface font-label-md text-[12px] tracking-wide"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Beranda
        </Link>
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-primary rounded-xl shadow-sm mb-2">
              <Icon name="architecture" className="text-primary-fixed text-[24px]" filled />
            </div>
            <h1 className="font-display text-[18px] font-extrabold text-on-surface tracking-tight">
              KANUM
            </h1>
            <p className="text-on-surface-variant text-[11px] mt-0.5">
              Matematika dalam Akar Budaya
            </p>
          </div>

          <h2 className="font-display text-[32px] font-extrabold mb-2 tracking-tight">Daftar</h2>
          {bannerMessage && (
            <div
              data-testid="auth-banner"
              className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-start gap-2"
            >
              <Icon name="error" className="text-[18px] mt-0.5 shrink-0" />
              <span>{bannerMessage}</span>
            </div>
          )}
          <p className="text-on-surface-variant text-sm mb-8">
            Buat akun KANUM baru dan mulai belajar.
          </p>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <Icon
                  name="person"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[19px]"
                />
                <input
                  className="w-full pl-11 pr-3 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Email
              </label>
              <div className="relative">
                <Icon
                  name="mail"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[19px]"
                />
                <input
                  className="w-full pl-11 pr-3 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Icon
                  name="lock"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[19px]"
                />
                <input
                  className="w-full pl-11 pr-11 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline"
                  onClick={() => setShowPass((v) => !v)}
                >
                  <Icon name={showPass ? "visibility_off" : "visibility"} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Ulangi Kata Sandi
              </label>
              <div className="relative">
                <Icon
                  name="lock_reset"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[19px]"
                />
                <input
                  className="w-full pl-11 pr-11 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  <Icon name={showConfirm ? "visibility_off" : "visibility"} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("siswa")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-colors ${
                    role === "siswa"
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:border-outline"
                  }`}
                >
                  <Icon name="school" className="text-[18px]" />
                  Siswa
                </button>
                <button
                  type="button"
                  onClick={() => setRole("guru")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-colors ${
                    role === "guru"
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:border-outline"
                  }`}
                >
                  <Icon name="history_edu" className="text-[18px]" />
                  Guru
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                {role === "siswa"
                  ? "Siswa masuk ke dashboard belajar & latihan."
                  : "Guru mendapat panel pengelolaan kelas & konten sendiri."}
              </p>
            </div>
            <label className="flex items-start gap-2.5 text-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 accent-primary"
              />
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
          <div className="relative my-6 flex items-center">
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
      </main>
    </div>
  );
}

export function RegisterForm() {
  return (
    <Suspense>
      <RegisterFormInner />
    </Suspense>
  );
}

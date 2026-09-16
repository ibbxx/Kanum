"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { AuthBrandPanel } from "@/components/layout/AuthBrandPanel";
import { homePathForAccess, resolveAccess } from "@/lib/auth";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Gagal masuk dengan Google. Coba lagi.",
  invalid_link: "Tautan verifikasi tidak valid atau sudah pernah dipakai.",
  link_expired: "Tautan verifikasi kedaluwarsa. Kirim ulang email verifikasi.",
  // OAuth dari /login dengan email yang belum punya akun KANUM.
  not_registered: "Akun belum terdaftar. Silakan daftar terlebih dahulu.",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function LoginFormInner() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  // Form email hanya untuk akun buatan admin — tersembunyi secara default.
  const [showEmailForm, setShowEmailForm] = useState(false);

  const errorCode = searchParams.get("error");
  const bannerMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? "Terjadi kesalahan. Coba lagi."
    : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      showToast("Isi email dan kata sandi", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      if (error?.message.toLowerCase().includes("email not confirmed")) {
        showToast("Email belum diverifikasi. Cek email Anda.", "error");
        window.location.assign(`/cek-email?email=${encodeURIComponent(email)}`);
        return;
      }
      if (error?.message.toLowerCase().includes("invalid login")) {
        showToast(
          "Email atau kata sandi salah. Jika Anda mendaftar dengan Google, gunakan tombol Masuk dengan Google.",
          "error"
        );
        return;
      }
      if (error?.message.toLowerCase().includes("rate limit")) {
        showToast("Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.", "error");
        return;
      }
      showToast("Gagal masuk: " + (error?.message || "akun tidak ditemukan"), "error");
      return;
    }
    const access = await resolveAccess(supabase, data.user.id);
    window.location.assign(homePathForAccess(access.access, access.role));
  }

  async function googleLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) showToast("Gagal: " + error.message, "error");
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-surface-container-lowest">
      <AuthBrandPanel />

      <main className="relative flex-1 flex items-center justify-center px-6 sm:px-10">
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

          <h2 className="font-display text-[32px] font-extrabold mb-2 tracking-tight">Masuk</h2>
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
            Masuk menggunakan akun Google Anda untuk melanjutkan belajar.
          </p>

          <button
            type="button"
            onClick={() => void googleLogin()}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <GoogleIcon />
            Masuk dengan Google
          </button>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow h-px bg-outline-variant/40" />
            <span className="px-3 text-outline text-[11px]">ATAU</span>
            <div className="flex-grow h-px bg-outline-variant/40" />
          </div>

          {!showEmailForm ? (
            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="w-full border border-outline-variant py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              <Icon name="mail" className="text-[18px]" />
              Masuk dengan Email &amp; Kata Sandi
            </button>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-outline mt-6 leading-relaxed">
            Belum punya akun? Daftar di halaman <Link href="/daftar" className="underline">Daftar</Link> menggunakan
            akun Google — Siswa langsung aktif, Guru diverifikasi Admin.
          </p>
        </div>
      </main>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}

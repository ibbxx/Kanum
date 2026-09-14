"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
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
};

function LoginFormInner() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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
        showToast("Email atau kata sandi salah", "error");
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
            Selamat datang kembali ke akun KANUM Anda.
          </p>
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
          <p className="text-center text-sm mt-3">
            <Link href="/lupa-password" className="text-primary font-semibold text-sm">
              Lupa kata sandi?
            </Link>
          </p>
          <div className="relative my-6 flex items-center">
            <div className="flex-grow h-px bg-outline-variant/40" />
            <span className="px-3 text-outline text-[11px]">ATAU</span>
            <div className="flex-grow h-px bg-outline-variant/40" />
          </div>
          <button
            type="button"
            onClick={googleLogin}
            className="w-full border border-outline-variant py-3 rounded-xl font-semibold"
          >
            Masuk dengan Google
          </button>
          <p className="text-center text-sm mt-6 text-on-surface-variant">
            Belum punya akun?{" "}
            <Link href="/daftar" className="text-primary font-bold">
              Daftar
            </Link>
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

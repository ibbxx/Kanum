"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link: "Tautan reset tidak valid atau sudah pernah dipakai. Kirim ulang email reset.",
  link_expired: "Tautan reset kedaluwarsa. Kirim ulang email reset.",
};

export function LupaPasswordForm() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const bannerMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? "Terjadi kesalahan. Coba lagi."
    : null;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      showToast("Isi email terlebih dahulu", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        showToast("Terlalu sering. Tunggu sebentar lalu coba lagi.", "error");
      } else {
        showToast("Gagal kirim email reset: " + error.message, "error");
      }
      return;
    }
    setSentTo(email);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-on-surface-variant">
          ← Beranda
        </Link>
        <h1 className="font-display text-3xl font-extrabold mt-6 mb-2 tracking-tight">
          Lupa Kata Sandi
        </h1>

        {sentTo ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container rounded-2xl mb-6 mt-4">
              <Icon
                name="mark_email_read"
                className="text-on-primary-container text-[32px]"
                filled
              />
            </div>
            <p className="text-on-surface-variant text-sm mb-6">
              Jika <span className="font-semibold text-on-surface">{sentTo}</span> terdaftar,
              tautan untuk mengatur ulang kata sandi sudah dikirim. Tautan berlaku 1 jam —
              periksa juga folder Spam/Promosi.
            </p>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="w-full border border-outline-variant py-3 rounded-xl font-semibold"
            >
              Gunakan email lain
            </button>
            <p className="text-center text-sm mt-6 text-on-surface-variant">
              Sudah ingat kata sandi?{" "}
              <Link href="/login" className="text-primary font-bold">
                Masuk
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-on-surface-variant text-sm mb-8">
              Masukkan email akun Anda dan kami akan mengirim tautan untuk mengatur ulang
              kata sandi.
            </p>
            {bannerMessage && (
              <div
                data-testid="auth-banner"
                className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-start gap-2"
              >
                <Icon name="error" className="text-[18px] mt-0.5 shrink-0" />
                <span>{bannerMessage}</span>
              </div>
            )}
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
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl"
              >
                {loading ? "Mengirim..." : "Kirim Tautan Reset"}
              </button>
            </form>
            <p className="text-center text-sm mt-6 text-on-surface-variant">
              Sudah ingat kata sandi?{" "}
              <Link href="/login" className="text-primary font-bold">
                Masuk
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

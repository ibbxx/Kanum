"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

const RESEND_KEY = "kanum:resend-at";
const COOLDOWN_MS = 60_000;

function CekEmailFormInner() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const last = Number(localStorage.getItem(RESEND_KEY) ?? 0);
    const remaining = Math.ceil((last + COOLDOWN_MS - Date.now()) / 1000);
    if (remaining > 0) setCooldown(remaining);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function resend() {
    if (!email) {
      showToast(
        "Email tidak terbaca. Buka halaman daftar lagi atau coba masuk untuk kirim ulang.",
        "error"
      );
      return;
    }
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setSending(false);
    if (error) {
      const isRateLimited =
        error.code === "over_email_send_rate_limit" ||
        error.message.toLowerCase().includes("rate limit");
      if (isRateLimited) {
        // Supabase menolak sebelum 60s berlalu — mulai cooldown agar user tidak spam.
        localStorage.setItem(RESEND_KEY, String(Date.now()));
        setCooldown(60);
        showToast("Terlalu sering. Tunggu 1 menit sebelum kirim ulang.", "error");
      } else {
        showToast("Gagal kirim ulang: " + error.message, "error");
      }
      return;
    }
    localStorage.setItem(RESEND_KEY, String(Date.now()));
    setCooldown(60);
    showToast("Email verifikasi baru sudah dikirim", "success");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-surface-container-lowest">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container rounded-2xl mb-6">
          <Icon name="mark_email_read" className="text-on-primary-container text-[32px]" filled />
        </div>
        <h1 className="font-display text-3xl font-extrabold mb-2 tracking-tight">
          Cek Email Anda
        </h1>
        <p className="text-on-surface-variant text-sm mb-6">
          {email ? (
            <>
              Kami mengirim tautan verifikasi ke{" "}
              <span className="font-semibold text-on-surface">{email}</span>. Klik tautan di
              email tersebut untuk mengaktifkan akun Anda.
            </>
          ) : (
            <>
              Kami mengirim tautan verifikasi ke email Anda. Klik tautan di email tersebut
              untuk mengaktifkan akun Anda.
            </>
          )}
        </p>
        <div className="bg-surface-container rounded-xl p-4 text-left text-sm text-on-surface-variant mb-8 space-y-2">
          <p className="flex items-start gap-2">
            <Icon name="schedule" className="text-[18px] mt-0.5 shrink-0" />
            Tautan berlaku 24 jam dan hanya bisa dipakai satu kali.
          </p>
          <p className="flex items-start gap-2">
            <Icon name="folder_sp" className="text-[18px] mt-0.5 shrink-0" />
            Tidak sampai? Periksa folder <span className="font-medium">Spam/Promosi</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={resend}
          disabled={sending || cooldown > 0}
          className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl disabled:opacity-50"
        >
          {cooldown > 0
            ? `Kirim ulang dalam ${cooldown}s`
            : sending
              ? "Mengirim..."
              : "Kirim Ulang Email Verifikasi"}
        </button>
        <p className="text-center text-sm mt-6 text-on-surface-variant">
          Sudah verifikasi?{" "}
          <Link href="/login" className="text-primary font-bold">
            Masuk
          </Link>
        </p>
        <Link href="/daftar" className="block text-center text-xs mt-2 text-outline">
          Gunakan email lain
        </Link>
      </div>
    </div>
  );
}

export function CekEmailForm() {
  return (
    <Suspense>
      <CekEmailFormInner />
    </Suspense>
  );
}

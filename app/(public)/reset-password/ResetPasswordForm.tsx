"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { homePathForRole, resolveUserRole } from "@/lib/auth";

export function ResetPasswordForm() {
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      showToast("Kata sandi minimal 6 karakter", "error");
      return;
    }
    if (password !== confirm) {
      showToast("Kata sandi tidak cocok", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      showToast("Gagal mengubah kata sandi: " + error.message, "error");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = user ? await resolveUserRole(supabase, user.id) : "student";
    showToast("Kata sandi berhasil diubah", "success");
    window.location.assign(homePathForRole(role));
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-extrabold mt-6 mb-2 tracking-tight">
          Atur Ulang Kata Sandi
        </h1>
        <p className="text-on-surface-variant text-sm mb-8">
          Buat kata sandi baru untuk akun Anda.
        </p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Kata Sandi Baru
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
                minLength={6}
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
              Ulangi Kata Sandi Baru
            </label>
            <div className="relative">
              <Icon
                name="lock_reset"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[19px]"
              />
              <input
                className="w-full pl-11 pr-3 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl"
          >
            {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
          </button>
        </form>
        <p className="text-center text-sm mt-6 text-on-surface-variant">
          <Link href="/login" className="text-primary font-bold">
            Kembali ke Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

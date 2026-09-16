"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { AuthBrandPanel } from "@/components/layout/AuthBrandPanel";

function CompleteSignupFormInner({ initialName = "" }: { initialName?: string }) {
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(initialName);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 3) {
      showToast("Nama lengkap minimal 3 karakter", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // Authority di DB (RPC complete_signup): siswa → approved (langsung
    // aktif), guru → pending (menunggu verifikasi Admin).
    const { data, error } = await supabase.rpc("complete_signup", {
      p_full_name: fullName.trim(),
      p_class_name: className.trim() || null,
    });
    if (error) {
      setLoading(false);
      showToast("Gagal: " + error.message, "error");
      return;
    }
    // Cookie role OAuth sudah habis dipakai.
    document.cookie = "kanum-oauth-role=; path=/; max-age=0";
    // Siswa → dashboard; guru → halaman menunggu verifikasi.
    window.location.assign(data === "approved" ? "/dashboard" : "/verifikasi");
  }

  return (
    <div className="min-h-[100dvh] flex overflow-hidden bg-surface-container-lowest">
      <AuthBrandPanel />
      <main className="relative flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-[380px]">
          <h2 className="font-display text-[28px] font-extrabold mb-2 tracking-tight">
            Lengkapi Pendaftaran
          </h2>
          <p className="text-on-surface-variant text-sm mb-8">
            Autentikasi Google berhasil. Isi data berikut untuk menyelesaikan
            pendaftaran akun KANUM Anda.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
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
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama sesuai sekolah"
                  minLength={3}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Kelas (jika siswa)
              </label>
              <div className="relative">
                <Icon
                  name="groups"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[19px]"
                />
                <input
                  className="w-full pl-11 pr-3 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="cth. VII A"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl disabled:opacity-50"
            >
              {loading ? "Memproses..." : "Selesaikan Pendaftaran"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export function CompleteSignupForm({ initialName = "" }: { initialName?: string }) {
  return (
    <Suspense>
      <CompleteSignupFormInner initialName={initialName} />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

export function LoginForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      showToast("Isi email dan kata sandi", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      showToast("Gagal masuk: " + error.message, "error");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single();
    router.replace(profile?.role === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  async function googleLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) showToast("Gagal: " + error.message, "error");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex relative w-[46%] bg-primary cultural-pattern flex-col justify-between px-14 py-12 text-primary-fixed">
        <Link href="/" className="inline-flex items-center gap-1.5 text-primary-fixed/70 hover:text-primary-fixed text-[12px]">
          <Icon name="arrow_back" className="text-[18px]" /> Beranda
        </Link>
        <div>
          <h1 className="font-display text-[26px] font-extrabold">KANUM</h1>
          <p className="text-primary-fixed/70 text-[13px] mt-2 max-w-[300px]">
            Matematika dalam akar budaya — belajar pola, simetri, dan hitungan dari kearifan tenun Nusantara.
          </p>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px]">
          <h2 className="font-display text-[32px] font-extrabold mb-2">Masuk</h2>
          <p className="text-on-surface-variant text-sm mb-8">Selamat datang kembali ke akun KANUM Anda.</p>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Email
              </label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/50 rounded-xl"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-11 bg-surface-container-low border border-outline-variant/50 rounded-xl"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline"
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

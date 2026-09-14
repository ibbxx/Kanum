"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { AuthBrandPanel } from "@/components/layout/AuthBrandPanel";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Gagal mendaftar dengan Google. Coba lagi.",
  // OAuth dari /daftar dengan email yang sudah punya akun KANUM
  // (role apa pun) — satu email = satu akun, arahkan ke sign-in.
  already_registered: "Email ini sudah terdaftar. Silakan masuk.",
};

function RegisterFormInner() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"siswa" | "guru">("siswa");
  const [loading, setLoading] = useState(false);
  // Form email & kata sandi (alternatif Google) — alur verifikasi sama.
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const errorCode = searchParams.get("error");
  const bannerMessage = errorCode
    ? ERROR_MESSAGES[errorCode] ?? "Terjadi kesalahan. Coba lagi."
    : null;

  const dbRole = role === "guru" ? "teacher" : "student";

  async function emailSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast("Isi nama lengkap", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Kata sandi minimal 6 karakter", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    // Metadata full_name/class_name/role dipetakan trigger handle_new_user
    // → profil baru SELALU status 'pending' (dibuat via SQL, bukan client).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: dbRole,
          ...(dbRole === "student" && className.trim()
            ? { class_name: className.trim() }
            : {}),
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/verifikasi`,
      },
    });
    setLoading(false);
    if (error) {
      showToast("Gagal mendaftar: " + error.message, "error");
      return;
    }
    // Anti-enumerasi Supabase: email sudah terdaftar → session null +
    // identities kosong (bukan error). Arahkan ke login, bukan cek-email.
    if (!data.session && data.user && (data.user.identities?.length ?? 0) === 0) {
      showToast("Email sudah terdaftar. Silakan masuk.", "error");
      return;
    }
    if (data.session) {
      // Konfirmasi email dimatikan → langsung ke halaman verifikasi.
      window.location.assign("/verifikasi");
      return;
    }
    // Email konfirmasi terkirim → verifikasi email dulu, lalu /verifikasi.
    window.location.assign(`/cek-email?email=${encodeURIComponent(email)}`);
  }

  function googleSignup() {
    setLoading(true);
    const supabase = createClient();
    // Simpan pilihan pengajuan — diterapkan oleh /auth/oauth-role setelah
    // OAuth kembali. Pilihan = PENGAJUAN, bukan hak akses: akun baru selalu
    // berstatus pending sampai diverifikasi (guru utk siswa, admin utk guru).
    document.cookie = `kanum-oauth-role=${dbRole}; path=/; max-age=1800; samesite=lax`;
    void supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/oauth-role`,
        },
      })
      .then(({ error }) => {
        if (error) {
          setLoading(false);
          showToast("Gagal: " + error.message, "error");
        }
      });
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
            Daftar sebagai siswa atau guru. Setiap pengajuan — lewat Google
            maupun email — diverifikasi pihak sekolah sebelum akun aktif.
          </p>

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
            <p className="text-xs text-on-surface-variant mt-2 flex items-start gap-1.5">
              <Icon name="info" className="text-[14px] mt-0.5 shrink-0" />
              {role === "siswa"
                ? "Pengajuan siswa diverifikasi oleh Guru sebelum dashboard belajar terbuka."
                : "Pengajuan guru diverifikasi oleh Admin sebelum panel guru terbuka."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void googleSignup()}
            disabled={loading}
            className="w-full mt-6 border border-outline-variant py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {loading ? "Mengalihkan ke Google..." : "Daftar dengan Google"}
          </button>

          {!showEmailForm ? (
            <>
              <div className="relative my-6 flex items-center">
                <div className="flex-grow h-px bg-outline-variant/40" />
                <span className="px-3 text-outline text-[11px]">ATAU</span>
                <div className="flex-grow h-px bg-outline-variant/40" />
              </div>
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full border border-outline-variant py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <Icon name="mail" className="text-[18px]" />
                Daftar dengan Email &amp; Kata Sandi
              </button>
            </>
          ) : (
            <form onSubmit={emailSignup} className="mt-6 space-y-4">
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
                    required
                  />
                </div>
              </div>
              {role === "siswa" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Kelas (opsional)
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
              )}
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
                    minLength={6}
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
                className="w-full bg-primary text-on-primary font-bold py-3.5 rounded-xl disabled:opacity-50"
              >
                {loading ? "Mendaftar..." : "Kirim Pengajuan Pendaftaran"}
              </button>
            </form>
          )}

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

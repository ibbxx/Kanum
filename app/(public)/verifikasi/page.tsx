import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { Icon } from "@/components/Icon";
import { ResubmitButton, StatusPoller, CompleteSignupLink } from "./VerifikasiActions";

export const dynamic = "force-dynamic";

/**
 * Halaman status verifikasi akun (khusus Guru — siswa langsung aktif).
 *   pending  → "Pengajuan akun Guru sedang menunggu verifikasi Admin."
 *   rejected → "Pengajuan akun Guru ditolak." + ajukan ulang (resubmit)
 *   approved → diarahkan ke /guru
 */
export default async function VerifikasiPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  // Admin selalu aktif; role lain ikut status.
  const access =
    profile.role === "admin"
      ? "approved"
      : profile.status === "approved"
        ? "approved"
        : profile.status === "rejected"
          ? "rejected"
          : "pending";

  if (access === "approved") {
    redirect(profile.role === "admin" ? "/admin" : profile.role === "teacher" ? "/guru" : "/dashboard");
  }

  // Verifikasi hanya untuk guru; siswa tidak pernah berstatus pending.
  const isTeacherPending = profile.role === "teacher";
  // Siswa pending lama (tersangkut sebelum fix alur) → recovery path,
  // bukan pesan "ditolak" yang menyesatkan.
  const isStudentPending = profile.role === "student";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-surface-container-lowest">
      <div className="w-full max-w-md">
        <div className="lg:flex items-center gap-3 mb-8 justify-center">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-primary rounded-xl shadow-sm mb-2 lg:mb-0">
            <Icon name="architecture" className="text-primary-fixed text-[24px]" filled />
          </div>
          <div>
            <h1 className="font-display text-[18px] font-extrabold text-on-surface tracking-tight">
              KANUM
            </h1>
            <p className="text-on-surface-variant text-[11px]">
              Matematika dalam Akar Budaya
            </p>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-2xl p-8 text-center">
          {access === "pending" ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary-container mb-4">
                <Icon name="hourglass_top" className="text-[32px]" />
              </div>
              <h2 className="font-display text-2xl font-extrabold mb-2 tracking-tight">
                Menunggu Verifikasi Admin
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {isTeacherPending ? (
                  <>
                    Pengajuan akun <strong>Guru</strong> sedang menunggu verifikasi{" "}
                    <strong>Admin</strong>. Anda akan mendapat akses setelah disetujui.
                  </>
                ) : isStudentPending ? (
                  <>
                    Pendaftaran akun Anda belum selesai. Silakan lengkapi data
                    untuk mengaktifkan akun Siswa Anda.
                  </>
                ) : (
                  <>
                    Pengajuan akun <strong>Guru</strong> ditolak. Jika Anda merasa ini
                    keliru, ajukan ulang — pihak sekolah akan memeriksa kembali.
                  </>
                )}
              </p>
              {isStudentPending && <CompleteSignupLink />}
              <div className="mt-6 px-4 py-3 rounded-xl bg-surface-container-low text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                  Akun
                </p>
                <p className="text-sm font-semibold">{profile.full_name || "—"}</p>
                <p className="text-sm text-on-surface-variant">{profile.email}</p>
              </div>
              <p className="text-xs text-outline mt-4 flex items-center justify-center gap-1.5">
                <Icon name="refresh" className="text-[14px]" />
                Status diperbarui otomatis setiap 15 detik
              </p>
              <StatusPoller />
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error-container text-on-error-container mb-4">
                <Icon name="cancel" className="text-[32px]" />
              </div>
              <h2 className="font-display text-2xl font-extrabold mb-2 tracking-tight">
                Pengajuan Ditolak
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Pengajuan akun Guru Anda ditolak. Jika Anda merasa ini keliru,
                ajukan ulang — pihak sekolah akan memeriksa kembali.
              </p>
              <ResubmitButton />
            </>
          )}

          <div className="mt-8 pt-6 border-t border-outline-variant/50">
            <LogoutButton className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-error" />
          </div>
        </div>
      </div>
    </div>
  );
}

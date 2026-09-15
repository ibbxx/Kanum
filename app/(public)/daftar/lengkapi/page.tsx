import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteSignupForm } from "./CompleteSignupForm";

export const dynamic = "force-dynamic";

/**
 * Form lengkapi pendaftaran — untuk akun hasil Google OAuth dari /daftar
 * yang belum submit form (masih pending). Siswa boleh kapan pun (fix alur
 * tersangkut); guru hanya ≤10 menit, setelah itu diarahkan ke /verifikasi.
 * Selain itu: approved → home, lainnya → /verifikasi, anonim → /login.
 */
export default async function LengkapiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  const created = new Date(profile.created_at as string).getTime();
  const stalePending = Date.now() - created >= 10 * 60 * 1000;

  if (profile.status === "approved") redirect("/dashboard");
  if (profile.status !== "pending") redirect("/verifikasi");
  // Siswa pending lama tetap boleh melengkapi pendaftaran — RPC
  // complete_signup mengaktifkan siswa tanpa batas usia akun (fix alur
  // tersangkut). Guru tetap dibatasi jendela 10 menit: pending guru adalah
  // status verifikasi yang sah, diproses Admin via antrean.
  if (profile.role !== "student" && stalePending) redirect("/verifikasi");

  // Prefill nama dari identitas Google (metadata) bila tersedia.
  const meta = user.user_metadata as Record<string, string | undefined>;
  const initialName =
    meta.full_name || meta.name || "";

  return <CompleteSignupForm initialName={initialName} />;
}

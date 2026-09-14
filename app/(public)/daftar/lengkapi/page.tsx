import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteSignupForm } from "./CompleteSignupForm";

export const dynamic = "force-dynamic";

/**
 * Form lengkapi pendaftaran — HANYA untuk akun baru hasil Google OAuth
 * dari /daftar yang belum submit form (masih pending, ≤10 menit).
 * Selain itu: approved → home, pending lama → /verifikasi, anonim → /login.
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
  const freshPending =
    profile.status === "pending" && Date.now() - created < 10 * 60 * 1000;

  if (!freshPending) {
    redirect(profile.status === "approved" ? "/dashboard" : "/verifikasi");
  }

  // Prefill nama dari identitas Google (metadata) bila tersedia.
  const meta = user.user_metadata as Record<string, string | undefined>;
  const initialName =
    meta.full_name || meta.name || "";

  return <CompleteSignupForm initialName={initialName} />;
}

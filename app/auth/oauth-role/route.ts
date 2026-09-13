import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate setelah Google OAuth dari halaman DAFTAR.
 * Alur: RegisterForm set cookie kanum-oauth-role → Google →
 * /auth/callback?next=/auth/oauth-role → route ini:
 *   1. RPC claim_signup_role: set role HANYA untuk akun baru (≤10 menit,
 *      masih 'student') — anti-eskalasi, akun lama tak berubah.
 *   2. Redirect ke home sesuai role efektif.
 */
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/daftar?error=oauth`);
  }

  const desiredRole =
    request.cookies.get("kanum-oauth-role")?.value === "teacher" ? "teacher" : "student";

  const { data: effectiveRole } = await supabase.rpc("claim_signup_role", {
    p_role: desiredRole,
  });

  const dest =
    effectiveRole === "admin" ? "/admin" : effectiveRole === "teacher" ? "/guru" : "/dashboard";

  const response = NextResponse.redirect(`${origin}${dest}`);
  // Cookie habis setelah diterapkan.
  response.cookies.set("kanum-oauth-role", "", { maxAge: 0, path: "/" });
  return response;
}

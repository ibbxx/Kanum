import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate setelah Google OAuth dari halaman DAFTAR.
 * Alur: RegisterForm set cookie kanum-oauth-role → Google →
 * /auth/callback?next=/auth/oauth-role → route ini:
 *   1. RPC claim_signup_role (authority DB) menetapkan role pengajuan
 *      pada akun baru (masih pending sampai form disubmit):
 *        'claimed'  → lanjut ke /daftar/lengkapi (form data pendaftaran;
 *                     submit memanggil RPC complete_signup yang
 *                     mengaktifkan siswa / mem-pending-kan guru)
 *        'existing' → email sudah terdaftar → JANGAN buat role/verifikasi
 *                     kedua; sign out + arahkan ke sign-in.
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

  // Authority di DB. Return 'existing' → email sudah terdaftar (versi baru).
  // Versi lama RPC mengembalikan role string — diperlakukan sebagai akun baru
  // agar aman di-deploy sebelum/sesudah migrasi SQL (urutan bebas).
  const { data: claim } = await supabase.rpc("claim_signup_role", { p_role: desiredRole });

  if (claim === "existing") {
    // CASE B — email sudah memiliki akun KANUM. Tidak ada account/profile/
    // role/verification kedua. Akhiri sesi yang tak diminta user, minta
    // sign in dengan akun existing.
    await supabase.auth.signOut();
    const response = NextResponse.redirect(`${origin}/login?error=already_registered`);
    response.cookies.set("kanum-oauth-role", "", { maxAge: 0, path: "/" });
    return response;
  }

  // Akun baru masih pending → lengkapi form data pendaftaran dulu.
  const response = NextResponse.redirect(`${origin}/daftar/lengkapi`);
  // Cookie habis setelah diterapkan.
  response.cookies.set("kanum-oauth-role", "", { maxAge: 0, path: "/" });
  return response;
}

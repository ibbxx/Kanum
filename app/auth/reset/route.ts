import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Link "Reset kata sandi" dari email Supabase mendarat di sini, dua format:
 * - PKCE: /auth/reset?code=...  (format bawaan @supabase/ssr, verifier di cookie)
 * - Token-hash: /auth/reset?token_hash=...&type=recovery
 * Membuat session recovery, lalu mengarahkan ke /reset-password.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as EmailOtpType | null) ?? "recovery";

  if (!code && !token_hash) {
    return NextResponse.redirect(`${origin}/lupa-password?error=invalid_link`);
  }

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type, token_hash: token_hash! });

  if (error) {
    const errCode = error.message.toLowerCase().includes("expired")
      ? "link_expired"
      : "invalid_link";
    return NextResponse.redirect(`${origin}/lupa-password?error=${errCode}`);
  }

  return NextResponse.redirect(`${origin}/reset-password`);
}

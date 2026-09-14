import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { homePathForAccess, resolveAccess } from "@/lib/auth";

/**
 * Supabase email verification (token-hash flow).
 * Link dari email konfirmasi mendarat di sini:
 *   /auth/confirm?token_hash=...&type=signup&next=/dashboard
 * Menukar token menjadi session cookie, lalu mengarahkan sesuai
 * akses efektif (pending/rejected → /verifikasi).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    const code = error.message.toLowerCase().includes("expired")
      ? "link_expired"
      : "invalid_link";
    return NextResponse.redirect(`${origin}/login?error=${code}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const access = user
    ? await resolveAccess(supabase, user.id)
    : { role: "student" as const, status: "pending" as const, access: "pending" as const };

  const dest =
    next &&
    access.access === "approved" &&
    (next.startsWith("/dashboard") || next.startsWith("/admin"))
      ? next
      : homePathForAccess(access.access, access.role);

  return NextResponse.redirect(`${origin}${dest}`);
}

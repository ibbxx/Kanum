import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole, resolveUserRole } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user ? await resolveUserRole(supabase, user.id) : "student";
  const dest =
    next &&
    (next.startsWith("/admin") || next.startsWith("/dashboard") || next === "/auth/oauth-role")
      ? next
      : homePathForRole(role);

  return NextResponse.redirect(`${origin}${dest}`);
}

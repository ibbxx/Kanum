import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homePathForAccess, resolveAccess } from "@/lib/auth";

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

  const access = user
    ? await resolveAccess(supabase, user.id)
    : { role: "student" as const, status: "pending" as const, access: "pending" as const };

  const dest =
    next && next === "/auth/oauth-role"
      ? next
      : next &&
          (next.startsWith("/admin") || next.startsWith("/dashboard")) &&
          access.access === "approved"
        ? next
        : homePathForAccess(access.access, access.role);

  return NextResponse.redirect(`${origin}${dest}`);
}

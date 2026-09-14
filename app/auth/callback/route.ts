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
    : {
        role: "student" as const,
        status: "pending" as const,
        access: "pending" as const,
      };

  // NIAT SIGN-IN (callback tanpa next=/auth/oauth-role):
  // Supabase selalu membuat auth.users untuk identitas Google baru —
  // tak bisa dicegah dari app. Deteksinya: profil pending & baru tercipta
  // (≤3 menit, trigger memberi pending hanya pada guru) → identitas
  // BELUM TERDAFTAR sebagai akun KANUM; jangan biarkan sign-in menjadi
  // sign-up: buang sesi, minta daftar.
  // Profil approved = terdaftar sah (siswa langsung approved saat daftar).
  const isLoginIntent = next !== "/auth/oauth-role";
  const created = user?.created_at ? new Date(user.created_at).getTime() : 0;
  const isFresh = created > 0 && Date.now() - created < 3 * 60 * 1000;
  if (isLoginIntent && user && access.status === "pending" && isFresh) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_registered`);
  }

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

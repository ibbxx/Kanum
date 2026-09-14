import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { homePathForAccess, resolveAccess } from "@/lib/auth";

const publicExact = new Set([
  "/",
  "/login",
  "/daftar",
  "/verifikasi",
  "/privacy",
  "/terms",
]);

function isPublicPath(pathname: string) {
  if (publicExact.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true; // termasuk /auth/oauth-role
  if (pathname.startsWith("/Asset/")) return true;
  return false;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as never)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isTeacherPath = pathname === "/guru" || pathname.startsWith("/guru/");
  const isStudentPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/materi") ||
    pathname.startsWith("/budaya") ||
    pathname.startsWith("/latihan") ||
    pathname.startsWith("/laporan") ||
    pathname.startsWith("/pengaturan");

  if (!user) {
    if (
      !isPublicPath(pathname) &&
      (isAdminPath || isTeacherPath || isStudentPath)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      const redirect = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => {
        redirect.cookies.set(c.name, c.value);
      });
      return redirect;
    }
    return supabaseResponse;
  }

  const { role, access } = await resolveAccess(supabase, user.id);

  // Login/daftar tidak relevan bagi user yang sudah masuk.
  if (pathname === "/login" || pathname === "/daftar") {
    const url = request.nextUrl.clone();
    url.pathname = homePathForAccess(access, role);
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c.name, c.value);
    });
    return redirect;
  }

  // Akun pending/rejected hanya boleh di halaman publik, /verifikasi,
  // dan /auth/* — tidak ada akses dashboard/guru/admin apa pun.
  if (
    access !== "approved" &&
    pathname !== "/verifikasi" &&
    !isPublicPath(pathname) &&
    !pathname.startsWith("/auth/") &&
    (isAdminPath || isTeacherPath || isStudentPath)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/verifikasi";
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c.name, c.value);
    });
    return redirect;
  }

  // /admin hanya admin sungguhan (guru masuk lewat /guru).
  if (isAdminPath && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = homePathForAccess(access, role);
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c.name, c.value);
    });
    return redirect;
  }

  // /guru untuk teacher; admin juga boleh (kelola semua).
  if (isTeacherPath && role !== "teacher" && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = homePathForAccess(access, role);
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c.name, c.value);
    });
    return redirect;
  }

  if (isStudentPath && role !== "student") {
    const url = request.nextUrl.clone();
    url.pathname = homePathForAccess(access, role);
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirect.cookies.set(c.name, c.value);
    });
    return redirect;
  }

  return supabaseResponse;
}

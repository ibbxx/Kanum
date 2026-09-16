import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * cache(): hasil di-memo per request — layout & page yang sama-sama
 * memanggil getProfile() hanya memicu SATU query ke Supabase.
 */

// ---- Identitas dari cookie (tanpa roundtrip jaringan) ----
// Cookie sesi @supabase/ssr: "sb-<ref>-auth-token" (encoding default
// base64url, atau chunk "sb-<ref>-auth-token.0", ".1", ... untuk sesi besar).
// Isinya JSON session yang access_token-nya JWT; klaim `sub` = user id.
// TIDAK ada keputusan otorisasi dari sini: sub hanya dipakai sebagai filter
// query yang tetap dijaga RLS (student_id = auth.uid() / id = auth.uid()).
const BASE64_PREFIX = "base64-";

function supabaseStorageKey(): string {
  const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  const ref = host.split(".")[0];
  return `sb-${ref}-auth-token`;
}

function base64UrlDecodeToString(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeJwtSub(jwt: string): string | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(base64UrlDecodeToString(parts[1])) as { sub?: unknown };
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** User id dari cookie sesi — verifikasi lokal, tanpa panggilan jaringan. */
export const getUserIdFromCookies = cache(async (): Promise<string | null> => {
  try {
    const key = supabaseStorageKey();
    const all = (await cookies()).getAll();

    // Nilai utama, atau gabungan chunk .0, .1, ... bila sesi dipecah cookie.
    let value = all.find((c) => c.name === key)?.value;
    if (!value) {
      const parts: string[] = [];
      for (let i = 0; ; i++) {
        const chunk = all.find((c) => c.name === `${key}.${i}`);
        if (!chunk) break;
        parts.push(chunk.value);
      }
      if (parts.length) value = parts.join("");
    }
    if (!value) return null;

    if (value.startsWith(BASE64_PREFIX)) {
      value = base64UrlDecodeToString(value.slice(BASE64_PREFIX.length));
    }
    const session = JSON.parse(value) as { access_token?: unknown };
    if (typeof session?.access_token !== "string") return null;
    return decodeJwtSub(session.access_token);
  } catch {
    // Cookie tidak ada / format tak dikenal → fallback jalur lama.
    return null;
  }
});

const PROFILE_COLUMNS = "id, full_name, email, class_name, role, status, avatar_url";

async function fetchOwnProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (data) return data;

  const { data: ensured } = await supabase.rpc("ensure_own_profile");
  if (ensured) return ensured;
  return null;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  // Identitas dari cookie sesi (lokal, tanpa jaringan). Bila cookie tidak
  // bisa dibaca, fallback getUser() — perilaku lama, termasuk auto-refresh.
  const userId = await getUserIdFromCookies();
  if (userId) {
    const profile = await fetchOwnProfile(supabase, userId);
    if (profile) return profile;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await fetchOwnProfile(supabase, user.id);
  if (profile) return profile;

  return {
    id: user.id,
    full_name:
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email ||
      "",
    email: user.email || "",
    class_name: "",
    role: "student",
    status: "pending",
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) || null,
  };
});

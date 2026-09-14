import type { AccessState, UserRole } from "@/lib/types";

type ProfileRow = { role?: string | null; status?: string | null };

export function homePathForRole(
  role?: string | null
): "/admin" | "/guru" | "/dashboard" {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/guru";
  return "/dashboard";
}

/**
 * Akses efektif = role + status verifikasi.
 * - admin selalu 'approved' (admin tidak melalui verifikasi publik)
 * - role lain mengikuti profiles.status
 * Requested role ≠ approved role: role hanya dipakai setelah approved.
 */
export function accessStateFor(
  role?: string | null,
  status?: string | null
): AccessState {
  if (role === "admin") return "approved";
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
}

/** Halaman tujuan berdasarkan akses efektif (pending/rejected → /verifikasi). */
export function homePathForAccess(
  access: AccessState,
  role?: string | null
): "/admin" | "/guru" | "/dashboard" | "/verifikasi" {
  if (access !== "approved") return "/verifikasi";
  return homePathForRole(role);
}

/**
 * Baca role + status profil user. Fallback: buat profil via RPC
 * ensure_own_profile (status awal 'pending' — menunggu verifikasi).
 */
export async function resolveAccess(
  supabase: {
    from: (table: string) => unknown;
    rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown }>;
  },
  userId: string
): Promise<{ role: UserRole; status: "pending" | "approved" | "rejected"; access: AccessState }> {
  const query = supabase.from("profiles") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => { maybeSingle: () => Promise<{ data: ProfileRow | null }> };
    };
  };

  const { data: profile } = await query
    .select("role, status")
    .eq("id", userId)
    .maybeSingle();

  let role = profile?.role ?? null;
  let status = profile?.status ?? null;

  if (!profile) {
    const { data: ensured } = await supabase.rpc("ensure_own_profile");
    const ensuredRow = ensured as ProfileRow | null;
    role = ensuredRow?.role ?? "student";
    status = ensuredRow?.status ?? "pending";
  }

  const effectiveRole: UserRole =
    role === "admin" ? "admin" : role === "teacher" ? "teacher" : "student";
  const effectiveStatus =
    status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";

  return {
    role: effectiveRole,
    status: effectiveStatus,
    access: accessStateFor(effectiveRole, effectiveStatus),
  };
}

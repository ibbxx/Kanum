import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccessState, UserRole } from "@/lib/types";
import type { Database } from "@/types/database";

function homePathForRole(
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
function accessStateFor(
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
 * Baca role + status profil user (tanpa membuat profil — pembuat
 * profil satu-satunya adalah trigger handle_new_user saat pendaftaran).
 */
export async function resolveAccess(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{
  role: UserRole;
  status: "pending" | "approved" | "rejected";
  access: AccessState;
  /**
   * true = TIDAK ADA baris profiles untuk user ini. Dibedakan dari
   * "baris ada tapi role/status kosong" karena artinya berbeda untuk
   * pemanggil: profil hilang = sesi yatim (akun sudah dihapus), sementara
   * role/status kosong = akun ada dan masih bisa dipulihkan.
   */
  missing: boolean;
}> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", userId)
    .maybeSingle();

  const role = profile?.role ?? null;
  const status = profile?.status ?? null;

  const effectiveRole: UserRole =
    role === "admin" ? "admin" : role === "teacher" ? "teacher" : "student";
  const effectiveStatus =
    status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";

  return {
    role: effectiveRole,
    status: effectiveStatus,
    access: accessStateFor(effectiveRole, effectiveStatus),
    missing: profile === null,
  };
}

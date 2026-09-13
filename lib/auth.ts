import type { UserRole } from "@/lib/types";

type RoleRow = { role?: string | null };

export function homePathForRole(
  role?: string | null
): "/admin" | "/guru" | "/dashboard" {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/guru";
  return "/dashboard";
}

export async function resolveUserRole(
  supabase: {
    from: (table: string) => unknown;
    rpc: (fn: string) => PromiseLike<{ data: unknown }>;
  },
  userId: string
): Promise<UserRole> {
  const query = supabase.from("profiles") as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => { maybeSingle: () => Promise<{ data: RoleRow | null }> };
    };
  };

  const { data: profile } = await query.select("role").eq("id", userId).maybeSingle();

  if (profile?.role === "admin") return "admin";
  if (profile?.role === "teacher") return "teacher";
  if (profile?.role === "student") return "student";

  const { data: ensured } = await supabase.rpc("ensure_own_profile");
  const ensuredRole = (ensured as RoleRow | null)?.role;
  return ensuredRole === "admin" ? "admin" : ensuredRole === "teacher" ? "teacher" : "student";
}

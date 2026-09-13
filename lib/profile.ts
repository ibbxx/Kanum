import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, class_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  const { data: ensured } = await supabase.rpc("ensure_own_profile");
  if (ensured) return ensured as Profile;

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
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) || null,
  };
}

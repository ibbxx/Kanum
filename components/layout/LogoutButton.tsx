"use client";

import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export function LogoutButton({
  className,
  label = "Logout",
}: {
  className?: string;
  label?: string;
}) {
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <button type="button" onClick={logout} className={cn(className)}>
      <Icon name="logout" className="text-[20px]" />
      <span>{label}</span>
    </button>
  );
}

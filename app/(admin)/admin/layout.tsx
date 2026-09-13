import { getProfile } from "@/lib/profile";
import { AdminShell } from "@/components/layout/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  return <AdminShell profile={profile}>{children}</AdminShell>;
}

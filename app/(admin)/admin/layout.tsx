import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { AdminShell } from "@/components/layout/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "teacher") redirect("/guru");
  if (profile.role !== "admin") redirect("/dashboard");
  return <AdminShell profile={profile}>{children}</AdminShell>;
}

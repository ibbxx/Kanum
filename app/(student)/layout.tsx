import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { StudentShell } from "@/components/layout/StudentShell";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "admin") redirect("/admin");
  return <StudentShell profile={profile}>{children}</StudentShell>;
}

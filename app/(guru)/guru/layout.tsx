import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { GuruShell } from "@/components/layout/GuruShell";

export const dynamic = "force-dynamic";

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // Guru dan admin (admin boleh melihat panel guru).
  if (profile.role !== "teacher" && profile.role !== "admin") redirect("/dashboard");
  return <GuruShell profile={profile}>{children}</GuruShell>;
}

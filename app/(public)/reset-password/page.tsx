import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Atur Ulang Kata Sandi | KANUM",
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // Halaman hanya boleh dibuka dengan session recovery (dari link email).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/lupa-password?error=invalid_link");
  }

  return <ResetPasswordForm />;
}

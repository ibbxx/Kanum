import { redirect } from "next/navigation";

export default async function LegacyQuizRedirect({
  searchParams,
}: {
  searchParams: Promise<{ ex?: string }>;
}) {
  const { ex } = await searchParams;
  if (ex) redirect(`/latihan/${ex}`);
  redirect("/latihan");
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";
import { decorateCaptions } from "@/lib/sanitize-html";
import type { Budaya } from "@/lib/types";

export default async function BudayaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  let { data } = await supabase.from("budaya").select("*").eq("id", id).eq("is_published", true).single();

  if (!data) {
    const byKey = await supabase
      .from("budaya")
      .select("*")
      .eq("topic_key", id)
      .eq("is_published", true)
      .single();
    data = byKey.data;
  }

  if (!data) notFound();
  const b = data as Budaya;

  return (
    <div className="max-w-3xl">
      <Link href="/budaya" className="text-sm text-primary font-semibold inline-flex items-center gap-1 mb-6">
        <Icon name="arrow_back" className="text-[18px]" /> Kembali
      </Link>
      <div className="rounded-3xl overflow-hidden mb-6 h-56 relative">
        <SmartImage
          src={b.image_url || "/Asset/Images/sejarahammatoa.png"}
          alt={b.title}
          priority
          className="object-cover"
          sizes="(min-width: 768px) 768px, 100vw"
        />
      </div>
      <p className="text-xs font-bold uppercase text-secondary mb-2">{b.category}</p>
      <h1 className="font-headline-md text-primary mb-4">{b.title}</h1>
      <p className="text-on-surface-variant mb-8 whitespace-pre-line">{b.description}</p>
      {b.content_html ? (
        <div
          className="prose-kanum bg-white border border-outline-variant rounded-2xl p-4 sm:p-6"
          dangerouslySetInnerHTML={{ __html: decorateCaptions(b.content_html) }}
        />
      ) : null}
    </div>
  );
}

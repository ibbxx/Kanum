import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";
import { levelBadge } from "@/lib/utils";
import { decorateCaptions } from "@/lib/sanitize-html";

export default async function MateriDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("materi")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!data) notFound();
  const m = data;

  return (
    <div className="max-w-3xl">
      <Link href="/materi" className="text-sm text-primary font-semibold inline-flex items-center gap-1 mb-6">
        <Icon name="arrow_back" className="text-[18px]" /> Kembali
      </Link>
      <div className="rounded-3xl overflow-hidden mb-6 h-56 relative bg-primary-container">
        <SmartImage
          src={m.image_url || "/Asset/Images/gambarmateri.png"}
          alt={m.title}
          priority
          className="object-cover"
          sizes="(min-width: 768px) 768px, 100vw"
        />
      </div>
      <div className="flex gap-2 mb-3">
        <span className="text-xs font-bold bg-surface-container px-3 py-1 rounded-full">
          {m.chapter_number > 0 ? `Bab ${m.chapter_number}` : "Materi"}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${levelBadge[m.level]}`}>
          {m.level}
        </span>
        <span className="text-xs text-on-surface-variant flex items-center gap-1">
          <Icon name="schedule" className="text-sm" /> {m.duration_minutes} menit
        </span>
      </div>
      <h1 className="font-headline-md text-primary mb-3">{m.title}</h1>
      <p className="text-on-surface-variant mb-8">{m.description}</p>
      {m.content_html ? (
        <div
          className="prose-kanum bg-white border border-outline-variant rounded-2xl p-4 sm:p-6"
          dangerouslySetInnerHTML={{ __html: decorateCaptions(m.content_html) }}
        />
      ) : (
        <p className="text-on-surface-variant italic">Konten materi belum diisi.</p>
      )}
      <Link
        href="/latihan"
        className="inline-flex mt-8 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold gap-2"
      >
        Latihan terkait <Icon name="fitness_center" />
      </Link>
    </div>
  );
}

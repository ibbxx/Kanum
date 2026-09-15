import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";
import { MateriGrid } from "./MateriGrid";
import type { Materi } from "@/lib/types";

export default async function MateriPage() {
  const supabase = await createClient();
  // content_html (artikel penuh) tidak dipakai grid — hanya di halaman
  // detail. Tidak diambil di sini → payload jauh lebih ringan.
  const { data } = await supabase
    .from("materi")
    .select(
      "id, title, chapter_number, level, description, duration_minutes, image_url, is_published, sort_order"
    )
    .eq("is_published", true)
    .order("sort_order");

  const items = (data || []) as Materi[];
  const totalMinutes = items.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const totalHours = totalMinutes > 0 ? `~${Math.max(1, Math.round(totalMinutes / 60))} Jam` : "~3 Jam";
  const totalBab = items.length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
        <Link href="/dashboard" className="text-primary font-semibold hover:underline">
          Dashboard
        </Link>
        <Icon name="chevron_right" className="text-base" />
        <span className="font-semibold text-on-surface">Materi Numerasi</span>
      </div>

      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-primary mb-8 min-h-[220px] flex items-end">
        <div className="absolute inset-0">
          <SmartImage
            src="/Asset/Images/sejarah_masyarakat_adat_kajang.png"
            alt="Masyarakat Adat Ammatoa Kajang"
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
        </div>
        <div className="ammatoa-pattern absolute inset-0 text-white pointer-events-none" />
        <div className="relative z-10 p-6 md:p-10 w-full text-white">
          <div className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-sm">
            <Icon name="menu_book" className="text-sm" />
            <span>Fase D · Numerasi</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold !text-white mb-2">
            Materi Numerasi
          </h1>
          <p className="text-primary-fixed/90 text-base max-w-2xl leading-relaxed">
            Belajar matematika melalui kearifan budaya Ammatoa Kajang — dari bilangan hingga peluang.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center min-w-[72px]">
              <div className="text-white font-bold text-lg">{totalBab}</div>
              <div className="text-primary-fixed/80 text-xs">Bab</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center min-w-[72px]">
              <div className="text-white font-bold text-lg">{totalHours}</div>
              <div className="text-primary-fixed/80 text-xs">Total Waktu</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center min-w-[72px]">
              <div className="text-white font-bold text-lg">SMP</div>
              <div className="text-primary-fixed/80 text-xs">Jenjang</div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Materi */}
      <MateriGrid items={items} />
    </div>
  );
}

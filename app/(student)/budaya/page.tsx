import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";

export default async function BudayaPage() {
  const supabase = await createClient();
  // content_html (artikel penuh) tidak dipakai grid — hanya di detail.
  const { data } = await supabase
    .from("budaya")
    .select("id, title, topic_key, category, description, image_url, is_published, sort_order")
    .eq("is_published", true)
    .order("sort_order");

  const items = data || [];
  const featured = items.find((b) => b.topic_key === "history") || items[0];

  return (
    // overflow-x-clip: mask budaya sengaja "bleed" keluar padding (-inset-x),
    // dan tanpa clip itu halaman bisa scroll horizontal beberapa piksel.
    // clip (bukan hidden) tidak membuat scroll container — header sticky di
    // StudentShell tetap berperilaku normal.
    <div className="relative overflow-x-clip">
      {/* Background Cultural Pattern Mask */}
      <div className="cultural-mask absolute -inset-x-4 -inset-y-6 sm:-inset-x-8 pointer-events-none opacity-30 -z-10" />

      {/* Header Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs md:text-sm mb-3">
          <Icon name="home" className="text-base" />
          <Link href="/dashboard" className="hover:underline">
            Beranda
          </Link>
          <Icon name="chevron_right" className="text-base" />
          <span className="font-bold text-on-surface">Eksplorasi Budaya Ammatoa</span>
        </div>
        <h1 className="font-display text-3xl md:text-5xl text-primary font-bold tracking-tight mb-4 leading-tight">
          Sejarah Masyarakat Adat <span className="text-secondary">Ammatoa Kajang</span>
        </h1>
        <p className="text-base md:text-lg text-on-surface-variant max-w-3xl leading-relaxed">
          Masyarakat adat Kajang, khususnya komunitas adat Ammatoa di Bulukumba, Sulawesi Selatan, adalah
          kelompok masyarakat yang hingga kini masih memelihara warisan budaya leluhur secara sangat kuat.
        </p>
      </section>

      <div className="ammatoa-divider mb-8" />

      {/* Featured Hero Section */}
      {featured && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          <Link
            href={`/budaya/${featured.id}`}
            className="lg:col-span-8 group relative rounded-3xl overflow-hidden bg-surface-container-highest shadow-md hover:shadow-xl transition-all duration-300 min-h-[340px] md:min-h-[400px] flex flex-col justify-end"
          >
            <div className="absolute inset-0">
              <SmartImage
                src={featured.image_url || "/Asset/Images/sejarah_masyarakat_adat_kajang.png"}
                alt={featured.title}
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
                sizes="(min-width: 1024px) 66vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
            </div>
            <div className="relative z-10 p-6 md:p-8 text-white">
              <span className="inline-block bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold w-fit mb-3 shadow-sm">
                TOPIK UTAMA
              </span>
              <h2 className="text-white font-headline-md text-2xl md:text-3xl font-bold mb-2 group-hover:text-primary-fixed transition-colors">
                {featured.title}
              </h2>
              <p className="text-white/90 text-sm md:text-base max-w-xl line-clamp-3 leading-relaxed">
                {featured.description}
              </p>
            </div>
          </Link>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-primary-container p-6 rounded-3xl text-on-primary-container flex-grow flex flex-col justify-center border border-primary/40 shadow-sm">
              <Icon name="functions" className="text-4xl mb-3 text-tertiary-fixed-dim" />
              <h3 className="font-headline-sm text-lg font-bold mb-2 text-white">
                Kaitan Matematika
              </h3>
              <p className="text-sm mb-4 text-white/90 leading-relaxed">
                Proses Pattannungan Kain Tope Le&apos;leng menggunakan sistem pengukuran tradisional hasta (1 hasta ≈ 40 cm) dan jumlah benang yang selalu ganjil untuk keseimbangan.
              </p>
              <Link
                href="/materi"
                className="inline-flex items-center gap-2 text-tertiary-fixed font-bold hover:underline text-sm mt-auto"
              >
                <span>Lihat Analisis</span>
                <Icon name="arrow_forward" className="text-base" />
              </Link>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant flex-grow flex flex-col justify-center shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <Icon name="star" className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Eksplorasi
                  </p>
                  <p className="font-headline-sm text-lg font-bold text-primary">
                    {items.length} Topik Budaya
                  </p>
                </div>
              </div>
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container w-[100%] transition-all duration-1000 ease-out" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Grid (Bento Style) */}
      <section className="mb-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-headline-md text-xl md:text-2xl font-bold text-primary">
              Galeri Visual Budaya Kajang
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Klik pada kartu untuk eksplorasi lebih dalam.
            </p>
          </div>
          <Link
            className="text-primary font-bold text-sm flex items-center gap-1 hover:opacity-70 transition-opacity"
            href="/materi"
          >
            <span>Lihat Materi</span>
            <Icon name="grid_view" className="text-base" />
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-on-surface-variant py-8 text-center">
            Belum ada konten budaya dipublikasikan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((b) => (
              <Link
                key={b.id}
                href={`/budaya/${b.id}`}
                className="bg-white border border-outline-variant rounded-[2rem] overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 overflow-hidden relative bg-primary-container">
                    <SmartImage
                      src={b.image_url || "/Asset/Images/sejarahammatoa.png"}
                      alt={b.title}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h3 className="font-headline-sm text-lg font-bold text-primary group-hover:text-primary-container transition-colors">
                        {b.title}
                      </h3>
                      <span className="text-secondary font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                        {b.category || "BUDAYA"}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-0">
                  <div className="w-full inline-flex items-center justify-center gap-2 py-3 bg-surface border border-primary text-primary rounded-xl font-bold group-hover:bg-primary group-hover:text-on-primary transition-colors text-sm">
                    <span>Buka Cerita</span>
                    <Icon name="arrow_forward" className="text-base" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

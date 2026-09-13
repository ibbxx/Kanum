import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Budaya } from "@/lib/types";

export default async function BudayaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("budaya")
    .select("id, title, topic_key, category, description, image_url, content_html, is_published, sort_order")
    .eq("is_published", true)
    .order("sort_order");

  const items = (data || []) as Budaya[];

  return (
    <div>
      <h1 className="font-headline-md text-primary mb-2">Budaya Ammatoa Kajang</h1>
      <p className="text-on-surface-variant mb-8">
        Eksplorasi etnomatematika dari kehidupan, tenun, dan kearifan Kajang.
      </p>
      {items.length === 0 ? (
        <p className="text-on-surface-variant">Belum ada konten budaya dipublikasikan.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((b) => (
            <Link
              key={b.id}
              href={`/budaya/${b.id}`}
              className="bg-white rounded-2xl overflow-hidden border border-outline-variant hover:shadow-lg"
            >
              <div className="h-44">
                <img
                  src={b.image_url || "/Asset/Images/sejarahammatoa.png"}
                  alt={b.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <span className="text-[10px] font-bold uppercase text-secondary">{b.category}</span>
                <h3 className="font-headline-sm text-primary mt-1">{b.title}</h3>
                <p className="text-sm text-on-surface-variant line-clamp-3 mt-2">{b.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

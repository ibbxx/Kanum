import { createClient } from "@/lib/supabase/server";
import { MateriGrid } from "./MateriGrid";
import type { Materi } from "@/lib/types";

export default async function MateriPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materi")
    .select(
      "id, title, chapter_number, level, description, duration_minutes, image_url, content_html, is_published, sort_order"
    )
    .eq("is_published", true)
    .order("sort_order");

  return (
    <div>
      <h1 className="font-headline-md text-primary mb-2">Materi</h1>
      <p className="text-on-surface-variant mb-8">
        Pelajari matematika melalui konteks budaya Ammatoa Kajang.
      </p>
      <MateriGrid items={(data || []) as Materi[]} />
    </div>
  );
}

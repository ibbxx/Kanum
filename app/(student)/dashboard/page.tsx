import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { Icon } from "@/components/Icon";
import type { StudentProgress } from "@/lib/types";

export default async function DashboardPage() {
  const profile = await getProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: progresses } = await supabase
    .from("student_progress")
    .select("is_completed, best_score, attempts_count")
    .eq("student_id", user?.id);

  const list = (progresses || []) as StudentProgress[];
  const completed = list.filter((p) => p.is_completed).length;
  const attempted = list.length;
  const avgScore =
    attempted > 0
      ? Math.round(list.reduce((s, p) => s + Number(p.best_score), 0) / attempted)
      : 0;
  const pct =
    attempted > 0 ? Math.min(Math.round((completed / Math.max(attempted, 1)) * 100), 100) : 0;

  const { data: budaya } = await supabase
    .from("budaya")
    .select("id, title, category, description, image_url")
    .eq("is_published", true)
    .order("sort_order")
    .limit(3);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary">
            Halo, {profile?.full_name || "Pengguna"}! 👋
          </h1>
          <p className="text-on-surface-variant">
            Semangat belajar hari ini! Kamu sudah selangkah lebih dekat dengan tujuanmu.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 relative overflow-hidden bg-primary rounded-3xl p-8 text-white min-h-[260px] flex flex-col justify-between cultural-pattern">
          <div>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-bold uppercase">
              Berjalan
            </span>
            <h2 className="text-[32px] mt-4 mb-2 font-bold">Lanjutkan Belajar</h2>
            <p className="text-primary-fixed opacity-90 max-w-md">
              Pelajari konsep matematika melalui konteks budaya Ammatoa Kajang.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress Belajar</span>
              <span className="font-bold">{pct}% Selesai</span>
            </div>
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-4">
              <div className="bg-tertiary-fixed-dim h-full" style={{ width: `${pct}%` }} />
            </div>
            <Link
              href="/materi"
              className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-bold"
            >
              Lanjutkan <Icon name="arrow_forward" />
            </Link>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-3xl border border-outline-variant flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary">
              <Icon name="menu_book" className="text-3xl" />
            </div>
            <div className="flex-1">
              <p className="text-label-md font-bold uppercase text-on-surface-variant">Materi</p>
              <h3 className="font-headline-sm text-primary">{pct}% Selesai</h3>
              <div className="mt-2 w-full bg-surface-container-highest h-1.5 rounded-full">
                <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-outline-variant flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-secondary">
              <Icon name="fitness_center" className="text-3xl" />
            </div>
            <div className="flex-1">
              <p className="text-label-md font-bold uppercase text-on-surface-variant">Latihan</p>
              <h3 className="font-headline-sm text-primary">{attempted} Latihan</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {completed > 0 ? `${completed} latihan selesai` : "Belum ada latihan selesai"}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-outline-variant flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center">
              <Icon name="quiz" className="text-3xl" />
            </div>
            <div className="flex-1">
              <p className="text-label-md font-bold uppercase text-on-surface-variant">Quiz</p>
              <h3 className="font-headline-sm text-primary">
                {attempted > 0 ? `${avgScore}/100` : "–"}
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {attempted > 0 ? `${attempted} percobaan total` : "Belum ada percobaan"}
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-12 mt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-headline-md text-primary">Eksplorasi Budaya Terbaru</h2>
              <p className="text-on-surface-variant">Temukan matematika dalam warisan Ammatoa Kajang.</p>
            </div>
            <Link href="/budaya" className="text-primary font-bold flex items-center gap-1">
              Lihat Semua <Icon name="chevron_right" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(budaya || []).map((b) => (
              <Link key={b.id} href={`/budaya/${b.id}`} className="group">
                <div className="relative h-48 rounded-2xl overflow-hidden mb-3">
                  <img
                    src={b.image_url || "/Asset/Images/sejarahammatoa.png"}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute bottom-3 left-3 bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {b.category}
                  </div>
                </div>
                <h3 className="font-headline-sm group-hover:text-primary">{b.title}</h3>
                <p className="text-body-sm text-on-surface-variant line-clamp-2">{b.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

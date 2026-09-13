import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [exRes, pubRes, stuRes, attRes, exList, progList] = await Promise.all([
    supabase.from("exercises").select("id", { count: "exact", head: true }),
    supabase.from("exercises").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("exercise_attempts").select("id", { count: "exact", head: true }),
    supabase
      .from("exercises")
      .select("id,title,category,is_published,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("student_progress")
      .select("student_id, attempts_count, best_score, profiles(full_name, class_name)")
      .order("best_score", { ascending: false })
      .limit(5),
  ]);

  type Top = {
    attempts_count: number;
    best_score: number;
    profiles: { full_name: string; class_name: string } | null;
  };
  const tops = (progList.data || []) as unknown as Top[];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          ["Total Latihan", exRes.count ?? 0],
          ["Dipublikasikan", pubRes.count ?? 0],
          ["Total Siswa", stuRes.count ?? 0],
          ["Total Percobaan", attRes.count ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white border border-outline-variant rounded-2xl p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">{label}</p>
            <p className="text-3xl font-extrabold text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-outline-variant rounded-2xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Latihan Terbaru</h3>
            <Link href="/admin/latihan" className="text-sm font-bold text-primary">
              Lihat Semua →
            </Link>
          </div>
          {(exList.data || []).length === 0 ? (
            <p className="text-sm text-on-surface-variant">Belum ada latihan</p>
          ) : (
            (exList.data || []).map((e) => (
              <div key={e.id} className="flex justify-between py-3 border-b border-surface-container-high last:border-0">
                <div>
                  <p className="font-bold text-sm">{e.title}</p>
                  <p className="text-xs text-on-surface-variant">{e.category}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${e.is_published ? "bg-green-100 text-green-800" : "bg-gray-100"}`}>
                  {e.is_published ? "Publik" : "Draft"}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="bg-white border border-outline-variant rounded-2xl p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold">Siswa Terbaik</h3>
            <Link href="/admin/progres" className="text-sm font-bold text-primary">
              Lihat Semua →
            </Link>
          </div>
          {tops.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Belum ada aktivitas siswa</p>
          ) : (
            tops.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-surface-container-high last:border-0">
                <div className="w-7 h-7 rounded-full bg-primary-container text-white text-xs font-extrabold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.profiles?.full_name || "–"}</p>
                  <p className="text-xs text-on-surface-variant">
                    {p.profiles?.class_name || ""} · {p.attempts_count} percobaan
                  </p>
                </div>
                <span className="font-extrabold text-primary">{Math.round(p.best_score)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-3 flex-wrap">
        <Link href="/admin/latihan" className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold">
          <Icon name="add" /> Tambah Latihan
        </Link>
        <Link href="/admin/materi" className="inline-flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-xl font-bold">
          <Icon name="menu_book" /> Kelola Materi
        </Link>
        <Link href="/admin/budaya" className="inline-flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-xl font-bold">
          <Icon name="museum" /> Kelola Budaya
        </Link>
      </div>
    </div>
  );
}

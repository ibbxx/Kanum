import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { formatDateId } from "@/lib/utils";

type ProgressRow = {
  exercise_id: string;
  best_score: number;
  is_completed: boolean;
  attempts_count: number;
  exercises: { title: string } | null;
};

type AttemptRow = {
  id: string;
  score: number | null;
  correct_count: number;
  wrong_count: number;
  started_at: string;
  finished_at: string | null;
  exercises: { title: string } | null;
};

export default async function LaporanPage() {
  const supabase = await createClient();
  // getProfile() di-cache per request (layout sudah memanggil) → id dari
  // sana, bukan roundtrip auth.getUser() tambahan.
  const profile = await getProfile();

  // Kedua query independen → paralel (dulu: sequential).
  const [progRes, attemptsRes] = await Promise.all([
    supabase
      .from("student_progress")
      .select("exercise_id, best_score, is_completed, attempts_count, exercises(title)")
      .eq("student_id", profile?.id),
    supabase
      .from("exercise_attempts")
      .select("id, score, correct_count, wrong_count, started_at, finished_at, exercises(title)")
      .eq("student_id", profile?.id)
      .order("started_at", { ascending: false })
      .limit(20),
  ]);

  const list = (progRes.data || []) as unknown as ProgressRow[];
  const completed = list.filter((p) => p.is_completed).length;
  const avg =
    list.length > 0
      ? Math.round(list.reduce((s, p) => s + Number(p.best_score), 0) / list.length)
      : 0;

  const attempts = attemptsRes.data;

  const rows = (attempts || []) as unknown as AttemptRow[];

  return (
    <div>
      <h1 className="font-headline-md text-primary mb-6">Laporan Belajar</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-outline-variant rounded-2xl p-5">
          <p className="text-xs uppercase text-outline">Progres</p>
          <p className="text-2xl font-bold text-primary mt-1">{list.length} latihan</p>
        </div>
        <div className="bg-white border border-outline-variant rounded-2xl p-5">
          <p className="text-xs uppercase text-outline">Rata-rata</p>
          <p className="text-2xl font-bold text-primary mt-1">{list.length ? avg : 0}</p>
        </div>
        <div className="bg-white border border-outline-variant rounded-2xl p-5">
          <p className="text-xs uppercase text-outline">Selesai</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {completed}/{list.length}
          </p>
        </div>
      </div>
      <div className="bg-white border border-outline-variant rounded-2xl p-6">
        <h2 className="font-headline-sm mb-4">Riwayat aktivitas</h2>
        {rows.length === 0 ? (
          <p className="text-sm italic text-on-surface-variant text-center py-6">
            Belum ada aktivitas latihan.
          </p>
        ) : (
          <div>
            {rows.map((a) => {
              const score = a.score !== null ? Math.round(a.score) : "–";
              const status =
                a.score !== null ? (a.score >= 70 ? "Lulus" : "Belum lulus") : "In Progress";
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 py-3 border-b border-outline-variant last:border-0"
                >
                  <div>
                    <p className="font-semibold text-sm">{a.exercises?.title || "Latihan"}</p>
                    <p className="text-xs text-on-surface-variant">
                      {formatDateId(a.finished_at || a.started_at)} · {a.correct_count} benar, {a.wrong_count} salah
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">{score}</p>
                    <p className="text-xs">{status}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/profile";
import { LatihanGrid } from "./LatihanGrid";
import type { Exercise, StudentProgress } from "@/lib/types";

export default async function LatihanPage() {
  const supabase = await createClient();

  // Kedua query independen → paralel (dulu: sequential).
  const [exercisesRes, progressRes] = await Promise.all([
    supabase
      .from("exercises")
      .select("id, title, description, category, difficulty, created_at, questions(id)")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("student_progress")
      .select("id, student_id, exercise_id, attempts_count, best_score, last_score, is_completed")
      .eq("student_id", (await getProfile())?.id),
  ]);

  const exercises = exercisesRes.data;
  const progress = progressRes.data;

  return (
    <div>
      <h1 className="font-headline-md text-primary mb-2">Latihan</h1>
      <p className="text-on-surface-variant mb-8">Kerjakan soal dari guru untuk mengukur pemahamanmu.</p>
      <LatihanGrid
        exercises={(exercises || []) as Exercise[]}
        progress={(progress || []) as StudentProgress[]}
      />
    </div>
  );
}

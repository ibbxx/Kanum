"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateId, formatDateTimeId } from "@/lib/utils";

type Student = { id: string; full_name: string; class_name: string; email: string };
type Progress = {
  student_id: string;
  exercise_id: string;
  attempts_count: number;
  best_score: number;
  last_score: number;
  is_completed: boolean;
  last_attempt: string | null;
  exercises: { title: string; passing_score?: number } | null;
};
type Attempt = {
  id: string;
  exercise_id: string;
  score: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  correct_count: number;
  wrong_count: number;
  exercises: { title: string } | null;
};
type Answer = {
  is_correct: boolean;
  points_earned: number;
  questions: { question: string; explanation: string; points: number } | null;
  question_options: { option_text: string } | null;
};

export function ProgresAdmin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [exercises, setExercises] = useState<{ id: string; title: string }[]>([]);
  const [q, setQ] = useState("");
  const [exId, setExId] = useState("");
  const [detail, setDetail] = useState<{ student: Student; progs: Progress[]; attempts: Attempt[] } | null>(null);
  const [answers, setAnswers] = useState<{ title: string; rows: Answer[] } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const [{ data: st }, { data: pr }, { data: ex }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,class_name,email").eq("role", "student").order("full_name"),
        supabase.from("student_progress").select("*, exercises(title, passing_score)"),
        supabase.from("exercises").select("id, title").order("title"),
      ]);
      setStudents((st || []) as Student[]);
      setProgress((pr || []) as Progress[]);
      setExercises((ex || []) as { id: string; title: string }[]);
    })();
  }, []);

  const filtered = students.filter((s) => !q || s.full_name.toLowerCase().includes(q.toLowerCase()));

  async function openDetail(s: Student) {
    const supabase = createClient();
    const [{ data: progs }, { data: attempts }] = await Promise.all([
      supabase
        .from("student_progress")
        .select("*, exercises(title, passing_score)")
        .eq("student_id", s.id)
        .order("last_attempt", { ascending: false }),
      supabase
        .from("exercise_attempts")
        .select("id, exercise_id, score, status, started_at, finished_at, correct_count, wrong_count, exercises(title)")
        .eq("student_id", s.id)
        .order("started_at", { ascending: false }),
    ]);
    setDetail({
      student: s,
      progs: (progs || []) as Progress[],
      attempts: (attempts || []) as unknown as Attempt[],
    });
  }

  async function openAnswers(attemptId: string, title: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("student_answers")
      .select("is_correct, points_earned, questions(question, explanation, points), question_options(option_text)")
      .eq("attempt_id", attemptId);
    setAnswers({ title, rows: (data || []) as unknown as Answer[] });
  }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 px-3 py-2 border rounded-xl"
          placeholder="Cari siswa..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="px-3 py-2 border rounded-xl" value={exId} onChange={(e) => setExId(e.target.value)}>
          <option value="">Semua latihan</option>
          {exercises.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white border border-outline-variant rounded-2xl overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Siswa</th>
              <th>Kelas</th>
              <th>Latihan</th>
              <th>Selesai</th>
              <th>Belum</th>
              <th>Skor terbaik</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              let progs = progress.filter((p) => p.student_id === s.id);
              if (exId) progs = progs.filter((p) => p.exercise_id === exId);
              const total = progs.length;
              const selesai = progs.filter((p) => p.is_completed).length;
              const best = total ? Math.round(Math.max(...progs.map((p) => Number(p.best_score)))) : 0;
              return (
                <tr key={s.id}>
                  <td>
                    <strong>{s.full_name}</strong>
                    <br />
                    <span className="text-xs text-on-surface-variant">{s.email}</span>
                  </td>
                  <td>{s.class_name || "–"}</td>
                  <td className="text-center">{total}</td>
                  <td className="text-center">{selesai}</td>
                  <td className="text-center">{total - selesai}</td>
                  <td className="text-center font-extrabold text-primary">{best || "–"}</td>
                  <td>
                    <button type="button" className="text-sm font-bold text-primary" onClick={() => void openDetail(s)}>
                      Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail ? (
        <div className="fixed inset-0 bg-black/40 z-[80] overflow-y-auto p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-3xl mx-auto my-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Detail – {detail.student.full_name}</h3>
            {detail.progs.length === 0 ? (
              <p>Belum ada latihan dikerjakan.</p>
            ) : (
              <>
                <table className="admin-table mb-6">
                  <thead>
                    <tr>
                      <th>Latihan</th>
                      <th>Percobaan</th>
                      <th>Terbaik</th>
                      <th>Status</th>
                      <th>Terakhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.progs.map((p) => (
                      <tr key={p.exercise_id}>
                        <td>{p.exercises?.title}</td>
                        <td>{p.attempts_count}</td>
                        <td>{Math.round(Number(p.best_score))}</td>
                        <td>{p.is_completed ? "Lulus" : "Belum lulus"}</td>
                        <td>{formatDateId(p.last_attempt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h4 className="font-bold text-sm uppercase mb-2">Riwayat</h4>
                {detail.attempts.map((a) => (
                  <div key={a.id} className="flex justify-between items-center border border-outline-variant rounded-xl p-3 mb-2">
                    <div>
                      <p className="font-bold text-sm">{a.exercises?.title}</p>
                      <p className="text-xs text-on-surface-variant">{formatDateTimeId(a.started_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-primary">{Math.round(a.score)}</span>
                      <button
                        type="button"
                        className="text-sm font-bold"
                        onClick={() => void openAnswers(a.id, a.exercises?.title || "")}
                      >
                        Jawaban
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            <button type="button" className="mt-4" onClick={() => setDetail(null)}>
              Tutup
            </button>
          </div>
        </div>
      ) : null}

      {answers ? (
        <div className="fixed inset-0 bg-black/50 z-[90] overflow-y-auto p-4" onClick={() => setAnswers(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl mx-auto my-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Jawaban – {answers.title}</h3>
            {answers.rows.map((a, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl mb-2 border ${a.is_correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}
              >
                <p className="font-bold text-sm">
                  {i + 1}. {a.questions?.question}
                </p>
                <p className="text-sm">Jawaban: {a.question_options?.option_text}</p>
                {!a.is_correct && a.questions?.explanation ? (
                  <p className="text-xs mt-1">Penjelasan: {a.questions.explanation}</p>
                ) : null}
              </div>
            ))}
            <button type="button" onClick={() => setAnswers(null)}>
              Tutup
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

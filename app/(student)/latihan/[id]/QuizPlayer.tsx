"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";
import type { QuizPayload, QuizQuestion, QuizResult } from "@/lib/types";

export function QuizPlayer({ exerciseId }: { exerciseId: string }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<QuizPayload | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("get_student_quiz", {
      p_exercise_id: exerciseId,
    });
    if (rpcError || !data) {
      setError(rpcError?.message || "Gagal memuat latihan.");
      setLoading(false);
      return;
    }
    const quiz = data as QuizPayload;
    if (!quiz.attempt_id) {
      setError("ID percobaan tidak diterima. Pastikan RPC get_student_quiz sudah dijalankan.");
      setLoading(false);
      return;
    }
    const qs = (quiz.questions || [])
      .map((q) => ({
        ...q,
        question_options: (q.options || q.question_options || []).slice().sort(
          (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
        ),
      }))
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
    if (!qs.length) {
      setError("Latihan ini belum memiliki soal.");
      setLoading(false);
      return;
    }
    setPayload(quiz);
    setQuestions(qs);
    setCurrent(0);
    setLoading(false);
  }, [exerciseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!payload) return;
    const unanswered = questions.findIndex((q) => !answers[q.id]);
    if (unanswered !== -1) {
      showToast(`Soal nomor ${unanswered + 1} belum dijawab.`, "error");
      setCurrent(unanswered);
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("submit_student_quiz", {
      p_attempt_id: payload.attempt_id,
      p_answers: questions.map((q) => ({
        question_id: q.id,
        option_id: answers[q.id],
      })),
    });
    setSubmitting(false);
    if (rpcError) {
      showToast("Gagal menyimpan hasil: " + rpcError.message, "error");
      return;
    }
    setResult((data || {}) as QuizResult);
  }

  if (loading) {
    return <p className="text-on-surface-variant">Memuat data latihan...</p>;
  }
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error mb-4">{error}</p>
        <button type="button" onClick={() => void load()} className="bg-primary text-on-primary px-4 py-2 rounded-xl">
          Coba lagi
        </button>
      </div>
    );
  }
  if (result) {
    const score = Math.round(Number(result.score ?? 0));
    const pass = score >= Number(result.passing_score ?? payload?.exercise.passing_score ?? 70);
    return (
      <div className="max-w-xl mx-auto bg-white border border-outline-variant rounded-2xl p-8 text-center">
        <Icon name={pass ? "emoji_events" : "refresh"} className="text-5xl text-primary mb-3" />
        <h2 className="font-headline-md text-primary mb-2">{pass ? "Lulus!" : "Belum lulus"}</h2>
        <p className="text-4xl font-extrabold text-primary mb-2">{score}/100</p>
        <p className="text-sm text-on-surface-variant mb-6">
          {result.correct_count ?? 0} benar · {result.wrong_count ?? 0} salah
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/latihan" className="border border-primary text-primary px-5 py-2 rounded-xl font-bold">
            Kembali
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="bg-primary text-on-primary px-5 py-2 rounded-xl font-bold"
          >
            Ulangi
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const total = questions.length;
  const pct = Math.round((current / total) * 100);

  return (
    <div className="grid lg:grid-cols-[1fr_240px] gap-6">
      <div>
        <p className="text-xs uppercase font-bold text-secondary mb-1">{payload?.exercise.category}</p>
        <h1 className="font-headline-md text-primary mb-4">{payload?.exercise.title}</h1>
        <div className="flex justify-between text-sm mb-2">
          <span>Soal {current + 1}/{total}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-surface-container rounded-full mb-6">
          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="bg-white border border-outline-variant rounded-2xl p-6">
          <p className="font-semibold text-lg mb-4">{q.question}</p>
          {q.image_url ? (
            <img src={q.image_url} alt="" className="w-full rounded-xl mb-4 max-h-64 object-contain" />
          ) : null}
          <div className="space-y-3">
            {q.question_options.map((opt, i) => {
              const selected = answers[q.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                  className={cn(
                    "w-full text-left flex gap-3 items-start p-4 rounded-xl border",
                    selected
                      ? "border-primary bg-primary-fixed/40"
                      : "border-outline-variant hover:bg-surface-container-low"
                  )}
                >
                  <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt.option_text}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
            className="px-5 py-2 rounded-xl border border-outline-variant disabled:opacity-40"
          >
            Sebelumnya
          </button>
          {current === total - 1 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold"
            >
              {submitting ? "Menyimpan..." : "Submit"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!answers[q.id]) {
                  showToast("Pilih jawaban terlebih dahulu", "error");
                  return;
                }
                setCurrent((c) => c + 1);
              }}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold"
            >
              Selanjutnya
            </button>
          )}
        </div>
      </div>
      <aside className="bg-white border border-outline-variant rounded-2xl p-4 h-fit">
        <p className="text-xs font-bold uppercase mb-3">Navigasi soal</p>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "h-9 rounded-lg text-sm font-bold",
                i === current
                  ? "bg-primary text-on-primary"
                  : answers[item.id]
                    ? "bg-primary-fixed text-primary"
                    : "bg-surface-container"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

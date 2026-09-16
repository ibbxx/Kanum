"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { difficultyBadge } from "@/lib/utils";
import type { Exercise, StudentProgress } from "@/lib/types";

/** Kolom yang benar-benar di-select halaman `/latihan` (bukan seluruh baris). */
type Item = Pick<
  Exercise,
  "id" | "title" | "description" | "category" | "difficulty" | "created_at"
> & { questions?: { id: string }[] };

/** Kolom progres yang dipakai grid ini. */
type ProgressItem = Pick<StudentProgress, "exercise_id" | "best_score" | "is_completed">;

export function LatihanGrid({
  exercises,
  progress,
}: {
  exercises: Item[];
  progress: ProgressItem[];
}) {
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("newest");
  const progMap = useMemo(() => {
    const m: Record<string, ProgressItem> = {};
    progress.forEach((p) => {
      m[p.exercise_id] = p;
    });
    return m;
  }, [progress]);

  const categories = useMemo(
    () => [...new Set(exercises.map((e) => e.category).filter(Boolean))].sort(),
    [exercises]
  );

  const list = useMemo(() => {
    let next = [...exercises];
    if (cat) next = next.filter((e) => (e.category || "").toLowerCase() === cat.toLowerCase());
    if (sort === "difficulty") {
      const rank: Record<string, number> = { Mudah: 1, Sedang: 2, Sulit: 3 };
      next.sort((a, b) => (rank[a.difficulty] || 2) - (rank[b.difficulty] || 2));
    } else {
      next.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }
    return next;
  }, [exercises, cat, sort]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {["", ...categories].map((c) => (
          <button
            key={c || "all"}
            type="button"
            onClick={() => setCat(c)}
            className={`px-6 py-2 rounded-full text-sm font-bold ${
              cat === c ? "bg-primary text-on-primary" : "bg-white border border-outline-variant"
            }`}
          >
            {c || "Semua"}
          </button>
        ))}
      </div>
      <select
        className="mb-6 px-3 py-2 rounded-lg border border-outline-variant"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="newest">Terbaru</option>
        <option value="difficulty">Kesulitan</option>
      </select>

      {list.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant">Belum ada latihan yang dipublikasikan.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((ex) => {
            const prog = progMap[ex.id];
            const score = prog ? Math.round(Number(prog.best_score)) : null;
            const done = prog?.is_completed;
            const label = done ? "Ulangi" : score !== null ? "Lanjutkan" : "Mulai";
            return (
              <article key={ex.id} className="bg-white rounded-xl border border-slate-100 flex flex-col overflow-hidden">
                <div className="h-40 bg-primary/10 flex items-center justify-center relative">
                  <Icon name="edit_square" className="text-primary opacity-30 text-[4rem]" />
                  <span className="absolute top-4 right-4 bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    {ex.category || "Umum"}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-headline-sm text-primary mb-2">{ex.title}</h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    {(ex.description || "").slice(0, 100)}
                    {ex.description?.length > 100 ? "..." : ""}
                  </p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase text-outline">Kesulitan</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${difficultyBadge[ex.difficulty]}`}>
                        {ex.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase text-outline">Jumlah Soal</span>
                      <span>{ex.questions?.length || 0} Soal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase text-outline">Skor Terbaik</span>
                      <span className="font-bold text-secondary">{score !== null ? `${score}/100` : "–"}</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${score || 0}%` }} />
                    </div>
                    <Link
                      href={`/latihan/${ex.id}`}
                      className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${
                        done
                          ? "border border-primary text-primary"
                          : "bg-primary text-on-primary"
                      }`}
                    >
                      <Icon name={done ? "refresh" : "play_arrow"} className="text-sm" /> {label}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

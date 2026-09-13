"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { levelBadge } from "@/lib/utils";
import type { Materi } from "@/lib/types";

const labels: Record<string, string> = {
  dasar: "DASAR",
  menengah: "MENENGAH",
  lanjut: "LANJUT",
};

export function MateriGrid({ items }: { items: Materi[] }) {
  const [level, setLevel] = useState("semua");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return items.filter((m) => {
      const matchLevel = level === "semua" || m.level === level;
      const matchQ = m.title.toLowerCase().includes(q.toLowerCase());
      return matchLevel && matchQ;
    });
  }, [items, level, q]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          className="flex-1 px-4 py-2 rounded-full bg-surface-container-low"
          placeholder="Cari materi..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {["semua", "dasar", "menengah", "lanjut"].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                level === l
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container border border-outline-variant"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant">Belum ada materi dipublikasikan.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="bg-surface rounded-2xl overflow-hidden border border-outline-variant flex flex-col"
            >
              <div className="h-44 relative bg-primary-container">
                <img
                  src={m.image_url || "/Asset/Images/gambarmateri.png"}
                  alt={m.title}
                  className="w-full h-full object-cover opacity-85"
                />
                <span className="absolute top-3 left-3 bg-surface/90 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                  {m.chapter_number > 0 ? `Bab ${m.chapter_number}` : "Materi"}
                </span>
                <span
                  className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${levelBadge[m.level] || levelBadge.dasar}`}
                >
                  {labels[m.level] || m.level}
                </span>
              </div>
              <div className="p-5 flex-1">
                <h3 className="font-display font-bold text-primary mb-1.5">{m.title}</h3>
                <p className="text-xs text-on-surface-variant">{m.description}</p>
              </div>
              <div className="p-5 pt-0 flex items-center justify-between border-t border-outline-variant/40 mx-5 mb-5 mt-auto">
                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <Icon name="schedule" className="text-sm text-primary" />
                  {m.duration_minutes} menit
                </span>
                <Link
                  href={`/materi/${m.id}`}
                  className="inline-flex items-center gap-1 bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Mulai Belajar <Icon name="arrow_forward" className="text-sm" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

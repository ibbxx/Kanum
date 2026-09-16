"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";
import { levelBadge } from "@/lib/utils";
import type { Materi } from "@/lib/types";

const labels: Record<string, string> = {
  dasar: "DASAR",
  menengah: "MENENGAH",
  lanjut: "LANJUT",
};

/** Kolom yang di-select halaman `/materi` — tanpa content_html (artikel
 *  penuh hanya diambil di halaman detail). */
type MateriCard = Pick<
  Materi,
  | "id"
  | "title"
  | "chapter_number"
  | "level"
  | "description"
  | "duration_minutes"
  | "image_url"
>;

export function MateriGrid({ items }: { items: MateriCard[] }) {
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
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-full px-4 py-2">
          <Icon name="search" className="text-outline text-base" />
          <input
            type="text"
            placeholder="Cari materi..."
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-36 md:w-48 text-on-surface"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["semua", "dasar", "menengah", "lanjut"].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                level === l
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {l === "semua" ? "Semua" : l}
            </button>
          ))}
        </div>
      </div>

      <h2 className="font-display text-xl font-bold text-primary mb-5">Semua Bab</h2>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-on-surface-variant">Belum ada materi dipublikasikan.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="group bg-surface rounded-2xl overflow-hidden border border-outline-variant flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-44 relative bg-primary-container overflow-hidden">
                <SmartImage
                  src={m.image_url || "/Asset/Images/gambarmateri.png"}
                  alt={m.title}
                  className="object-cover opacity-85"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

/* ════════════════ Elemen kecil toolbar editor ════════════════ */

/** Grup tombol toolbar (borders + radius seragam). */
export function Group({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-outline-variant bg-white px-1 py-0.5">
      {children}
    </div>
  );
}

/**
 * Popover toolbar.
 * Auto-clamp: setelah render, geser popout agar tidak keluar viewport kiri/
 * kanan (anchor mengikuti tombol; layar sempit sering membuat right-0/
 * left-0 tetap keluar layar).
 */
export function Popover({
  children,
  wide,
  align = "left",
}: {
  children: ReactNode;
  wide?: boolean;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clamp = () => {
      el.style.left = "";
      el.style.right = "";
      const r = el.getBoundingClientRect();
      if (r.left < 8) {
        el.style.left = "0";
        el.style.right = "auto";
        el.style.transform = "none";
      } else if (r.right > window.innerWidth - 8) {
        el.style.right = "0";
        el.style.left = "auto";
        el.style.transform = "none";
      }
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);
  return (
    <div
      ref={ref}
      data-testid="editor-popover"
      className={`absolute top-full z-20 mt-2 max-w-[calc(100vw-3rem)] rounded-2xl border border-outline-variant bg-white p-3 shadow-lg ${
        align === "right" ? "right-0" : "left-0"
      } ${wide ? "w-80" : "w-60"}`}
    >
      {children}
    </div>
  );
}

/** Palet warna teks / highlight. Swatch 32px — cukup untuk tap presisi. */
export function Swatches({
  colors,
  onPick,
  onClear,
}: {
  colors: string[];
  onPick: (c: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            aria-label={`Warna ${c}`}
            onClick={() => onPick(c)}
            className="h-8 w-8 rounded-lg border border-outline-variant"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 min-h-9 w-full rounded-lg border border-outline-variant px-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
      >
        Hapus warna
      </button>
    </div>
  );
}

/** Baris input + OK di dalam popover (link & URL gambar). */
export function PopoverRow({
  value,
  onChange,
  onOk,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onOk: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onOk();
          }
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <button
        type="button"
        onClick={onOk}
        className="min-h-9 shrink-0 rounded-lg bg-primary px-3.5 text-xs font-bold text-on-primary hover:bg-primary-container"
      >
        OK
      </button>
    </div>
  );
}

/**
 * Tombol toolbar. Bisa memuat ikon (Material Symbols) atau label teks
 * (B/I/U/S, ¶, H1…). Tinggi 40px di mobile (touch target) dan 32px di
 * desktop agar baris toolbar tetap rapat.
 */
export function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  label,
  icon,
  bold,
  italic,
  underline,
  strike,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  label?: string;
  icon?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}) {
  const textStyle = [bold ? "font-bold" : "", italic ? "italic" : "", underline ? "underline" : "", strike ? "line-through" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // jaga seleksi teks di editor
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md px-1.5 text-sm transition-colors sm:h-8 sm:min-w-8 ${
        active
          ? "bg-primary text-on-primary"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {icon ? (
        <Icon name={icon} className="text-[18px] leading-none" />
      ) : (
        <span className={textStyle}>{label}</span>
      )}
    </button>
  );
}

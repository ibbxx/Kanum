"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

/* ════════════════ Elemen kecil toolbar editor ════════════════ */

/** Grup tombol toolbar (borders + radius seragam).
 *  flex-wrap agar popover inline (mobile) bisa turun ke baris baru.
 *
 *  MOBILE + POPOVER TERBUKA: grup dan wrapper tombol yang memuat popover
 *  WAJIB melebar penuh. Tanpa itu rantai `shrink-0` membuat lebar grup =
 *  lebar konten tombol (±40px), sehingga `w-full` pada popover hanya
 *  dihitung dari lebar 40px itu → popover terhimpit dan isinya overflow
 *  keluar menu "More"; menu memakai `overflow-y-auto`, dan karena satu sumbu
 *  bukan `visible`, overflow-x ikut jadi `auto` → isi popover terpotong.
 *  Dengan melebar penuh, popover berada di dalam batas menu (tidak
 *  terpotong) dan memakai lebar yang tersedia.
 *
 *  MOBILE: `max-w-full` juga wajib. `shrink-0` + lebar konten membuat
 *  grup yang tombolnya banyak (mis. B/I/U/S/x²/x₂/bersihkan format = 302px)
 *  TIDAK pernah menyusut, sehingga di menu "More" yang sempit (320px) grup
 *  melebihi lebar menu → menu memakai `overflow-y-auto`, overflow-x ikut
 *  `auto`, dan seluruh isi (termasuk popover) bisa tergeser/terpotong.
 *  Dengan dibatasi `max-w-full` + `flex-wrap`, tombolnya pindah baris
 *  mengikuti lebar yang tersedia.
 *
 *  DESKTOP (≥sm) tidak terpengaruh sama sekali: di situ popover tetap
 *  `absolute` (flyout di bawah tombol), jadi tidak ada wrapper yang
 *  perlu melebar — semua rule di bawah di-scope `max-sm`.
 *  (`:has()` didukung semua browser evergreen sejak 2023.) */
export function Group({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-0.5 rounded-lg border border-outline-variant bg-white px-1 py-0.5 max-sm:max-w-full max-sm:[&:has(.editor-popover)]:w-full max-sm:[&>div:has(.editor-popover)]:w-full">
      {children}
    </div>
  );
}

/**
 * Popover toolbar.
 *
 * **Responsif mobile/desktop:**
 * - Desktop (≥640px): `absolute` di bawah tombol, auto-clamp kiri/kanan agar
 *   tidak keluar viewport.
 * - Mobile (<640px): `relative` inline — mengalir di dalam parent (termasuk
 *   di dalam overflow menu "More") sehingga TIDAK terpotong `overflow-y-auto`.
 *
 * Deteksi breakpoint pakai `window.matchMedia` agar class CSS dan clamp-logic
 * konsisten (tidak ada flash layout).
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
    // Hanya clamp di desktop (absolute positioning)
    const mq = window.matchMedia("(min-width: 640px)");
    const clamp = () => {
      if (!mq.matches) return; // mobile → inline, tidak perlu clamp
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
      className={`editor-popover rounded-2xl border border-outline-variant bg-white p-3 shadow-lg ${
        /* Mobile: inline (relative), penuh 1 kolom di dalam container. */
        "relative mt-2 w-full"
      } ${
        /* Desktop: absolute flyout di bawah tombol. */
        `sm:absolute sm:top-full sm:z-20 sm:mt-2 sm:max-w-[calc(100vw-3rem)] ${
          align === "right" ? "sm:right-0 sm:left-auto" : "sm:left-0 sm:right-auto"
        } ${wide ? "sm:w-80" : "sm:w-60"}`
      }`}
    >
      {children}
    </div>
  );
}

/** Palet warna teks / highlight.
 *
 * MOBILE: swatch 44px (touch target minimum) — desktop tetap 32px lewat `sm:`,
 * jadi baris toolbar desktop tidak berubah sama sekali. */
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
            className="h-11 w-11 rounded-lg border border-outline-variant sm:h-8 sm:w-8"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 min-h-11 w-full rounded-lg border border-outline-variant px-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low sm:min-h-9"
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
        className="min-w-0 flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none max-sm:py-2.5"
      />
      <button
        type="button"
        onClick={onOk}
        className="min-h-11 shrink-0 rounded-lg bg-primary px-3.5 text-xs font-bold text-on-primary hover:bg-primary-container sm:min-h-9"
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

/* ════════════════ Panel alat mobile ("Alat lainnya") ════════════════ */

/**
 * Satu kategori di panel mobile: subjudul ringan + grid 3 kolom.
 *
 * `first:border-t-0`: garis pemisah antar-kategori saja, tanpa garis di atas
 * kategori pertama. Popup tool TIDAK dirender di sini — ia punya slot tetap
 * di bawah panel (lihat MateriContentEditor) supaya selalu terlihat penuh.
 */
export function MobileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-outline-variant/60 pt-3 first:border-t-0 first:pt-0">
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">
        {title}
      </h4>
      <div className="grid grid-cols-3 gap-1.5">{children}</div>
    </section>
  );
}

/**
 * Tombol alat untuk panel mobile: ikon/teks + label di bawahnya, sehingga
 * setiap tool tetap bisa dipahami tanpa tooltip (yang tidak muncul di layar
 * sentuh). Tinggi minimum 56px = nyaman untuk jempol.
 *
 * - `variant="tile"` (default): kotak 1 kolom grid, isi vertikal.
 * - `variant="row"`: satu baris penuh (col-span-3), ikon di kiri + label
 *   di kanan — dipakai untuk aksi yang berdiri sendiri dalam kategorinya.
 *
 * `active` di-set sebagai `aria-pressed` juga supaya status format terbaca
 * pembaca layar, bukan hanya warna.
 */
export function MobileToolButton({
  onClick,
  active,
  disabled,
  title,
  caption,
  label,
  icon,
  bold,
  italic,
  underline,
  strike,
  variant = "tile",
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** aria-label + tooltip (dipakai juga oleh harness E2E). */
  title: string;
  /** Label yang terlihat di bawah ikon — harus mudah dipahami. */
  caption: string;
  /** Karakter teks pengganti ikon (B/I/U/S, ¶, H1…). */
  label?: string;
  icon?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  variant?: "tile" | "row";
}) {
  const textStyle = [bold ? "font-bold" : "", italic ? "italic" : "", underline ? "underline" : "", strike ? "line-through" : ""]
    .filter(Boolean)
    .join(" ");
  const state = active
    ? "border-primary bg-primary text-on-primary"
    : "border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container-high hover:text-on-surface";
  const glyph = icon ? (
    <Icon name={icon} className="text-[20px] leading-none" />
  ) : (
    <span className={`text-[15px] ${textStyle}`}>{label}</span>
  );

  if (variant === "row") {
    return (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        aria-pressed={active}
        className={`col-span-3 flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${state} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">{glyph}</span>
        <span className="min-w-0 flex-1 text-left leading-tight">{caption}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-semibold leading-tight transition-colors ${state} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">{glyph}</span>
      <span className="line-clamp-2 w-full text-center">{caption}</span>
    </button>
  );
}

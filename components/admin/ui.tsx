"use client";

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   Primitif UI bersama untuk panel admin.

   Tujuan: satu definisi untuk pola yang berulang di halaman/form admin —
   struktur modal, tombol aksi, kartu daftar, badge, dan toolbar filter —
   supaya spacing, tinggi tombol, ukuran ikon, radius, dan state hover/
   disabled/focus konsisten di seluruh panel (bukan disalin per halaman).
   ═══════════════════════════════════════════════════════════════════════════ */

/** Kelas input standar admin — satu definisi agar semua form konsisten. */
export const inputCls =
  "w-full min-w-0 rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";

type ButtonVariant = "outline" | "primary" | "danger" | "ghost";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  outline:
    "border border-outline-variant font-semibold text-on-surface hover:bg-surface-container-low",
  primary: "bg-primary font-bold text-on-primary hover:bg-primary-container",
  danger: "bg-error font-bold text-on-error hover:bg-error-container",
  ghost:
    "font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
};

/**
 * Tombol aksi utama (modal & header halaman). Tinggi tetap 44px (h-11) →
 * touch target memenuhi pedoman mobile tanpa padding tambahan per pemakaian.
 */
export function ActionButton({
  variant = "outline",
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANT[variant],
        className,
      )}
      {...rest}
    />
  );
}

/* ── Form ────────────────────────────────────────────────────────────────── */

export function SectionHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-3">
      <h3 className="font-display text-sm font-bold text-on-surface">{title}</h3>
      {desc && <p className="mt-0.5 text-xs text-on-surface-variant">{desc}</p>}
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-on-surface-variant">{hint}</span>}
    </label>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────────── */

/**
 * Kerangka modal admin.
 *
 * MOBILE: penuh viewport (100dvh, aman dari chrome browser) → header tetap,
 *         SATU area scroll, footer tetap dengan safe-area.
 * DESKTOP: terpusat, max-height 92vh, area scroll hanya bila perlu.
 *
 * Body halaman DIKUNCI selama modal terbuka supaya tidak ada dua scroller
 * aktif (halaman ikut bergeser di belakang modal pada mobile).
 */
export function ModalShell({
  title,
  description,
  eyebrow,
  maxWidth = "sm:max-w-5xl",
  closeLabel = "Tutup",
  onRequestClose,
  footer,
  children,
  testId,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  /** Kelas max-width panel untuk breakpoint sm ke atas. */
  maxWidth?: string;
  closeLabel?: string;
  onRequestClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      data-testid={testId}
    >
      <div
        className={cn(
          "flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl",
          maxWidth,
        )}
      >
        {/* Header — di luar area scroll, tidak ikut bergeser */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-outline-variant px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                {eyebrow}
              </p>
            )}
            <h2 className="truncate font-display text-lg font-bold text-on-surface">{title}</h2>
            {/* Deskripsi konteks hanya desktop: di mobile header tetap ringkas
                sehingga chrome sticky tidak memakan viewport editor. */}
            {description && (
              <p className="mt-0.5 hidden text-sm text-on-surface-variant sm:block">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRequestClose}
            aria-label={closeLabel}
            title={closeLabel}
            className="-mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <Icon name="close" className="text-[20px] leading-none" />
          </button>
        </div>

        {/* Body — SATU-SATUNYA area scroll modal (tanpa nested scroll). */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          data-testid={testId ? `${testId}-scroll` : undefined}
        >
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}

/** Footer sticky: status di kiri, aksi di kanan, aman terhadap safe-area. */
export function ModalFooter({
  status,
  dirty,
  children,
  testId,
}: {
  status: string;
  dirty?: boolean;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-between gap-3 border-t border-outline-variant bg-white px-5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-6 sm:pt-3"
      data-testid={testId}
    >
      <span
        className={cn(
          "min-w-0 truncate text-sm font-semibold",
          dirty ? "text-secondary" : "text-on-surface-variant/60",
        )}
      >
        {status}
      </span>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

/** Dialog konfirmasi (hapus / buang perubahan) — struktur & z-index seragam. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busyLabel,
  cancelLabel = "Batal",
  busy = false,
  icon,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  icon?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
              <Icon name={icon} className="text-[20px] leading-none" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-on-surface">{title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <ActionButton variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </ActionButton>
          <ActionButton variant="danger" onClick={onConfirm} disabled={busy}>
            {busy && (
              <Icon name="progress_activity" className="text-[16px] leading-none animate-spin" />
            )}
            {busy && busyLabel ? busyLabel : confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

/* ── Daftar / kartu ──────────────────────────────────────────────────────── */

export function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
      <span className="h-1.5 w-1.5 rounded-full bg-on-surface-variant/50" />
      Draft
    </span>
  );
}

type ActionTone = "primary" | "outline" | "muted" | "danger";

const ACTION_TONE: Record<ActionTone, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container",
  outline:
    "border border-outline-variant text-on-surface hover:border-primary hover:text-primary",
  muted:
    "border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary",
  danger: "text-error hover:bg-error-container/50",
};

/**
 * Tombol aksi kartu daftar.
 * Mobile/tablet: hanya ikon dalam kotak 40×40 (touch target, teks tidak
 * bertabrakan). Desktop ≥lg: label tampil, tinggi 44px sejajar tombol lain.
 */
export function CardActionButton({
  onClick,
  icon,
  label,
  title,
  tone = "outline",
  disabled,
  busy,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  title?: string;
  tone?: ActionTone;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={title ?? label}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        "lg:h-11 lg:w-auto lg:px-3.5",
        ACTION_TONE[tone],
      )}
    >
      {/* Ukuran ikon memakai text-* (bukan utility lebar/tinggi) supaya glyph
          tepat seukuran kotaknya: tidak meluber dan semua tombol simetris. */}
      <Icon
        name={busy ? "progress_activity" : icon}
        className={cn("shrink-0 text-[18px] leading-none lg:text-[16px]", busy && "animate-spin")}
      />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

/** Cover thumbnail kartu — rasio & radius seragam. */
export function CardCover({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-on-surface-variant/40">
        <Icon name="image" className="text-[24px] leading-none" />
      </div>
    );
  }
  return <SmartImage src={src} alt={alt} sizes="128px" className="object-cover" />;
}

/**
 * Kartu daftar admin: cover + info + baris aksi.
 * Mobile/tablet: aksi turun ke baris penuh di bawah (satu baris ikon saja)
 * sehingga info tidak terhimpit; ≥lg aksi sejajar kanan bersama info.
 */
export function ListCard({
  cover,
  info,
  actions,
}: {
  cover: ReactNode;
  info: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="group flex flex-wrap items-center gap-x-3 gap-y-0 rounded-2xl border border-outline-variant bg-white p-3 transition-shadow hover:shadow-md sm:gap-x-4 sm:p-4">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-container-low sm:h-20 sm:w-32">
        {cover}
      </div>
      <div className="min-w-0 flex-1">{info}</div>
      {/* Baris aksi: di bawah lg selalu baris penuh (info tidak terhimpit di
          tablet, di mana sidebar admin mengurangi lebar konten); ≥lg sejajar. */}
      <div className="mt-2.5 flex w-full shrink-0 items-center justify-end gap-1.5 border-t border-outline-variant/60 pt-2.5 lg:mt-0 lg:w-auto lg:gap-2 lg:border-0 lg:pt-0">
        {actions}
      </div>
    </div>
  );
}

/* ── Toolbar daftar ──────────────────────────────────────────────────────── */

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel = "Cari",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  ariaLabel?: string;
}) {
  return (
    <div className="relative w-full basis-full sm:basis-auto sm:max-w-sm sm:flex-1">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        type="search"
        aria-label={ariaLabel}
        className={cn(inputCls, "pl-10")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className={cn(inputCls, "flex-1 font-semibold sm:w-auto sm:flex-none")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

export function ResultCount({ children }: { children: ReactNode }) {
  return (
    <span className="ml-auto hidden shrink-0 text-sm text-on-surface-variant sm:block">
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: string;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-white px-6 py-14 text-center sm:py-16">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant">
        <Icon name={icon} className="text-[28px] leading-none" />
      </span>
      <h3 className="mt-4 font-display text-base font-bold text-on-surface">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{desc}</p>
      {action}
    </div>
  );
}

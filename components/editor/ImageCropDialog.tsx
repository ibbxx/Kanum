"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { ActionButton } from "@/components/admin/ui";

/**
 * Dialog crop berbasis canvas — hasilnya gambar BARU (bukan crop CSS),
 * di-upload lewat pipeline existing supaya tersimpan permanen.
 *
 * Susunan: header tetap → SATU area scroll → footer tetap (safe-area aware).
 * Rect crop disimpan dalam koordinat gambar NATURAL lalu dirender sebagai
 * persentase, sehingga presisi di viewport apa pun.
 */

const CROP_RATIOS: Array<{ label: string; value: number | null }> = [
  { label: "Bebas", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
  { label: "9:16", value: 9 / 16 },
];

type CropMode = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const HANDLES: Array<[CropMode, string]> = [
  ["nw", "-top-1.5 -left-1.5 cursor-nwse-resize"],
  ["ne", "-top-1.5 -right-1.5 cursor-nesw-resize"],
  ["sw", "-bottom-1.5 -left-1.5 cursor-nesw-resize"],
  ["se", "-bottom-1.5 -right-1.5 cursor-nwse-resize"],
  ["n", "top-0 left-1/2 h-2 w-6 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize"],
  ["s", "bottom-0 left-1/2 h-2 w-6 -translate-x-1/2 translate-y-1/2 cursor-ns-resize"],
  ["w", "left-0 top-1/2 h-6 w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
  ["e", "right-0 top-1/2 h-6 w-2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
];

/** Label aksesibel per handle (ikon-only → wajib punya nama). */
const HANDLE_LABEL: Record<CropMode, string> = {
  move: "Geser area crop",
  nw: "Ubah ukuran dari sudut kiri atas",
  ne: "Ubah ukuran dari sudut kanan atas",
  sw: "Ubah ukuran dari sudut kiri bawah",
  se: "Ubah ukuran dari sudut kanan bawah",
  n: "Ubah ukuran dari sisi atas",
  s: "Ubah ukuran dari sisi bawah",
  w: "Ubah ukuran dari sisi kiri",
  e: "Ubah ukuran dari sisi kanan",
};

/** Ukuran minimum crop (px natural). */
const MIN_SIZE = 24;

export function ImageCropDialog({
  src,
  onCancel,
  onApply,
}: {
  src: string;
  onCancel: () => void;
  onApply: (file: File) => Promise<boolean> | boolean | void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Rect crop dalam koordinat gambar NATURAL; dirender sebagai % dari ukuran
  // tampil sehingga posisi/handle selalu presisi di viewport apa pun.
  const rect = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const natural = useRef({ w: 0, h: 0 });
  const drag = useRef<{
    mode: CropMode;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
  }>({ mode: "move", sx: 0, sy: 0, ox: 0, oy: 0, ow: 0, oh: 0 });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      imgRef.current = im;
      natural.current = { w: im.naturalWidth, h: im.naturalHeight };
      // Crop awal 80% tengah — ROOT CAUSE lama: rect awal = gambar penuh,
      // sehingga ruang gerak move = 0 dan drag terasa mati.
      rect.current = {
        x: im.naturalWidth * 0.1,
        y: im.naturalHeight * 0.1,
        w: im.naturalWidth * 0.8,
        h: im.naturalHeight * 0.8,
      };
      setErr("");
      setNonce((n) => n + 1);
    };
    im.onerror = () => setErr("Gambar tidak dapat dimuat untuk crop.");
    im.src = src;
  }, [src]);

  // Canvas hanya menggambar GAMBAR. Rect crop, dim, dan handle digambar
  // oleh DOM overlay (jelas terlihat + hit area akurat untuk pointer).
  useEffect(() => {
    const im = imgRef.current;
    const cv = canvasRef.current;
    if (!im || !cv) return;
    const scale = Math.min(1, 560 / im.naturalWidth);
    cv.width = Math.max(1, Math.round(im.naturalWidth * scale));
    cv.height = Math.max(1, Math.round(im.naturalHeight * scale));
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(im, 0, 0, cv.width, cv.height);
  }, [nonce, ratio]);

  function clampRect(r: { x: number; y: number; w: number; h: number }) {
    const n = natural.current;
    const w = Math.min(n.w, Math.max(MIN_SIZE, r.w));
    const h = Math.min(n.h, Math.max(MIN_SIZE, r.h));
    return {
      x: Math.min(Math.max(0, r.x), n.w - w),
      y: Math.min(Math.max(0, r.y), n.h - h),
      w,
      h,
    };
  }

  function applyRatio(rv: number | null) {
    setRatio(rv);
    const n = natural.current;
    if (!n.w) return;
    if (rv === null) {
      rect.current = clampRect({ x: n.w * 0.1, y: n.h * 0.1, w: n.w * 0.8, h: n.h * 0.8 });
    } else {
      // Fit rasio ke dalam 80% gambar, centered.
      let w = n.w * 0.8;
      let h = w / rv;
      if (h > n.h * 0.8) {
        h = n.h * 0.8;
        w = h * rv;
      }
      rect.current = clampRect({ x: (n.w - w) / 2, y: (n.h - h) / 2, w, h });
    }
    setNonce((v) => v + 1);
  }

  // Mapping pointer (px CSS tampil) → koordinat natural. Dihitung dari
  // getBoundingClientRect (bukan bitmap canvas) agar tidak ada offset saat
  // canvas di-stretch oleh CSS.
  function toNatural(clientX: number, clientY: number) {
    const cv = canvasRef.current;
    const n = natural.current;
    if (!cv || !n.w) return { x: 0, y: 0 };
    const b = cv.getBoundingClientRect();
    return {
      x: ((clientX - b.left) / Math.max(1, b.width)) * n.w,
      y: ((clientY - b.top) / Math.max(1, b.height)) * n.h,
    };
  }

  // Drag/resize: pointerdown di layer/handle, lalu move/up dipasang di WINDOW
  // (pola terbukti dari fix resize NodeView — tidak bergantung pointer capture
  // yang bisa gagal/lepas saat pointer keluar dari elemen kecil).
  function startDrag(e: React.PointerEvent<HTMLElement>, mode: CropMode) {
    const n = natural.current;
    if (!n.w) return;
    e.preventDefault();
    e.stopPropagation();
    const p = toNatural(e.clientX, e.clientY);
    drag.current = {
      mode,
      sx: p.x,
      sy: p.y,
      ox: rect.current.x,
      oy: rect.current.y,
      ow: rect.current.w,
      oh: rect.current.h,
    };
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      const q = toNatural(ev.clientX, ev.clientY);
      const dx = q.x - d.sx;
      const dy = q.y - d.sy;
      if (d.mode === "move") {
        rect.current = clampRect({ x: d.ox + dx, y: d.oy + dy, w: d.ow, h: d.oh });
      } else {
        const m = d.mode;
        let x = d.ox,
          y = d.oy,
          w = d.ow,
          h = d.oh;
        if (m.includes("e")) w = d.ow + dx;
        if (m.includes("s")) h = d.oh + dy;
        if (m.includes("w")) {
          w = d.ow - dx;
          x = d.ox + dx;
        }
        if (m.includes("n")) {
          h = d.oh - dy;
          y = d.oy + dy;
        }
        if (ratio) {
          if (m.includes("e") || m.includes("w")) {
            h = w / ratio;
            if (m.includes("n")) y = d.oy + d.oh - h;
          } else {
            w = h * ratio;
            if (m.includes("w")) x = d.ox + d.ow - w;
          }
        }
        rect.current = clampRect({ x, y, w, h });
      }
      setNonce((v) => v + 1);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  async function doApply() {
    const im = imgRef.current;
    if (!im || busy) return;
    setBusy(true);
    setErr("");
    const r = rect.current;
    // Output pada resolusi natural area crop — kualitas maksimum sebelum
    // pipeline kompresi existing menangani ukuran file.
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(r.w));
    out.height = Math.max(1, Math.round(r.h));
    const ctx = out.getContext("2d");
    if (!ctx) {
      setBusy(false);
      setErr("Canvas tidak tersedia di browser ini.");
      return;
    }
    try {
      ctx.drawImage(im, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob(resolve, "image/webp", 0.92),
      );
      if (!blob) {
        setBusy(false);
        setErr("Gagal memproses gambar hasil crop.");
        return;
      }
      const ext = blob.type === "image/png" ? "png" : "webp";
      const ok = await onApply(new File([blob], `crop-${Date.now()}.${ext}`, { type: blob.type }));
      if (ok === false) {
        // Upload gagal: gambar lama tetap dipakai, dialog tetap terbuka (retry/cancel).
        setBusy(false);
        setErr("Upload hasil crop gagal. Gambar lama tetap dipakai — coba lagi atau Batalkan.");
        return;
      }
      setBusy(false);
    } catch {
      // Canvas tainted (URL eksternal tanpa CORS) → gambar asli utuh.
      setBusy(false);
      setErr("Gambar ini tidak dapat di-crop (dari sumber eksternal).");
    }
  }

  const n = natural.current;
  const pct = (v: number, total: number) => (total ? `${(v / total) * 100}%` : "0%");

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl">
        {/* Header — tetap */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant px-4 py-2.5 sm:px-5 sm:py-3">
          <h3 className="font-display text-base font-bold text-on-surface">Crop Gambar</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup"
            title="Tutup"
            className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high"
          >
            <Icon name="close" className="text-[20px] leading-none" />
          </button>
        </div>

        {/* Body — SATU area scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {CROP_RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                aria-pressed={ratio === r.value}
                className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${
                  ratio === r.value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-low"
                }`}
                onClick={() => applyRatio(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Preview. Rasio container = rasio gambar ASLI (bukan 4:3 tetap):
              tanpa letterbox, pemetaan pointer (getBoundingClientRect →
              koordinat natural) tepat, sehingga crop tidak meleset pada
              gambar bersumbu selain 4:3. */}
          <div className="mx-auto w-full max-w-2xl">
            <div className="relative w-full" style={n.w ? { aspectRatio: `${n.w} / ${n.h}` } : undefined}>
              {/* Lapisan gambar + peredup, dipotong ke sudut membulat */}
              <div className="absolute inset-0 overflow-hidden rounded-xl bg-black">
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                {/* Area di luar crop diredupkan agar batas crop terlihat jelas */}
                {n.w > 0 && (
                  <div
                    className="pointer-events-none absolute border-2 border-white/90"
                    style={{
                      left: pct(rect.current.x, n.w),
                      top: pct(rect.current.y, n.h),
                      width: pct(rect.current.w, n.w),
                      height: pct(rect.current.h, n.h),
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
                    }}
                  />
                )}
              </div>

              {/* Area geser (di bawah handle, di atas gambar) */}
              <div
                className="absolute inset-0 cursor-move touch-none"
                onPointerDown={(e) => startDrag(e, "move")}
                aria-hidden
              />

              {/* Handle resize — di luar wrapper ber-overflow-hidden agar tidak
                  terpotong; hit area diperluas oleh .crop-handle::after */}
              {HANDLES.map(([mode, cls]) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={HANDLE_LABEL[mode]}
                  title={HANDLE_LABEL[mode]}
                  className={`crop-handle absolute h-4 w-4 rounded-full border-2 border-primary bg-white shadow hover:bg-primary ${cls}`}
                  onPointerDown={(e) => startDrag(e, mode)}
                />
              ))}
            </div>
          </div>

          {err && <p className="mt-3 text-center text-sm text-error">{err}</p>}

          <p className="mt-3 text-center text-[11px] text-on-surface-variant">
            Geser bagian tengah untuk memindahkan, tarik titik/sisi untuk mengubah ukuran.
          </p>
        </div>

        {/* Footer — tetap, safe-area aware */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-outline-variant px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-5 sm:pt-3">
          <ActionButton onClick={onCancel} disabled={busy}>
            Batal
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={() => void doApply()}
            disabled={busy || !imgRef.current}
          >
            {busy && (
              <Icon name="progress_activity" className="text-[16px] leading-none animate-spin" />
            )}
            {busy ? "Memproses..." : "Terapkan Crop"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

/**
 * Global image compression (browser-side, transparent to the user).
 *
 * Every image upload in KANUM goes through here before touching Supabase
 * Storage. Pipeline per iteration:
 *   1. decode via <img> (object URL, revoked after use)
 *   2. draw to canvas, aspect ratio preserved, only downscale (never upscale)
 *   3. re-encode (WebP → JPEG for opaque, WebP → PNG for transparent)
 *   4. if still oversized, shrink dimensions (×0.8) and/or lower quality, retry
 *
 * Bounded: fixed maximum iterations + hard floor on canvas size, so the loop
 * always terminates. Result is ALWAYS a compressed re-encode (never the
 * original bytes) whenever the source exceeds maxBytes; a small source that
 * already fits is re-encoded losslessly as PNG/WebP so it stays intact
 * without degradation.
 */

export const IMAGE_MAX_BYTES = 300 * 1024;

/** Hard cap on encoded side length — far above anything a 300 KB target needs. */
const MAX_DIMENSION = 2048;
/** Minimum canvas side during iteration; below this we stop resizing. */
const MIN_DIMENSION = 32;
/** Iteration bound: quality/scale steps converge well before this. */
const MAX_ITERATIONS = 8;
/** Start quality for lossy encode. */
const START_QUALITY = 0.82;
/** Stop lowering quality below this — further reduction comes from resize. */
const MIN_QUALITY = 0.4;

export type CompressedImage = {
  /** Compressed image ready for upload. */
  file: File;
  mime: string;
  size: number;
  /** Extension derived from the final mime type (e.g. "webp", "png", "jpeg"). */
  ext: string;
};

export class ImageValidationError extends Error {}

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/avif"];

/** User-friendly message for any image processing failure. */
export const IMAGE_ERROR_MESSAGE = "Gambar tidak dapat diproses. Silakan pilih gambar lain.";

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpeg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return mime.split("/")[1] || "bin";
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = url;
  });
}

function hasAlpha(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 255) return true;
    }
  } catch {
    return false;
  }
  return false;
}

/** Validate type/size only — no UI-facing details. */
export async function validateImageFile(file: File): Promise<void> {
  const type = (file.type || "").toLowerCase();
  const looksImage = ACCEPTED_MIME.includes(type) || /^image\//.test(type);
  if (!looksImage) throw new ImageValidationError(IMAGE_ERROR_MESSAGE);
  // Decode attempt is the real validation — corrupt files fail here.
  const url = URL.createObjectURL(file);
  try {
    await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Compress an image file until it fits `maxBytes` (default 300 KB).
 * Throws ImageValidationError with a user-friendly message on failure.
 */
export async function compressImage(
  file: File,
  maxBytes: number = IMAGE_MAX_BYTES
): Promise<CompressedImage> {
  await validateImageFile(file);

  // Pass-through: file kecil yang sudah memenuhi target & format yang
  // diterima bucket tidak perlu di-encode ulang (hindari degradasi tanpa
  // manfaat). Format lain (gif/bmp/avif) tetap di-encode ulang ke web format.
  const type = (file.type || "").toLowerCase();
  if (
    file.size <= maxBytes &&
    (type === "image/jpeg" || type === "image/png" || type === "image/webp")
  ) {
    return {
      file,
      mime: type,
      size: file.size,
      ext: extForMime(type === "image/jpeg" ? "image/jpeg" : type),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(objectUrl);
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new ImageValidationError(IMAGE_ERROR_MESSAGE);
  }
  URL.revokeObjectURL(objectUrl);

  const sourceW = img.naturalWidth || img.width;
  const sourceH = img.naturalHeight || img.height;
  if (!sourceW || !sourceH) throw new ImageValidationError(IMAGE_ERROR_MESSAGE);

  // Initial draw size: shrink only, respect hard dimension cap.
  let width = sourceW;
  let height = sourceH;
  if (Math.max(width, height) > MAX_DIMENSION) {
    const s = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * s);
    height = Math.round(height * s);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ImageValidationError(IMAGE_ERROR_MESSAGE);
  ctx.drawImage(img, 0, 0, width, height);

  // Detect transparency: keep it via WebP/PNG instead of flattening to JPEG.
  const alpha = hasAlpha(ctx, canvas.width, canvas.height);
  const encodeOrder = alpha
    ? ["image/webp", "image/png"]
    : ["image/webp", "image/jpeg"];

  let quality = START_QUALITY;
  let best: { blob: Blob; mime: string } | null = null;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let result: { blob: Blob; mime: string } | null = null;

    for (const mime of encodeOrder) {
      const blob = await canvasToBlob(canvas, mime, quality);
      if (!blob) continue;
      if (blob.size > maxBytes) continue;
      if (!best || blob.size < best.blob.size) best = { blob, mime };
      if (!result || blob.size < result.blob.size) result = { blob, mime };
    }

    if (best) break;

    // Still oversized → tighten quality first, then scale down.
    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.14);
      continue;
    }
    const nextW = Math.max(MIN_DIMENSION, Math.round(canvas.width * 0.8));
    const nextH = Math.max(MIN_DIMENSION, Math.round(canvas.height * 0.8));
    if (nextW === canvas.width && nextH === canvas.height) break; // floor reached
    const scaled = document.createElement("canvas");
    scaled.width = nextW;
    scaled.height = nextH;
    const sctx = scaled.getContext("2d");
    if (!sctx) break;
    sctx.drawImage(canvas, 0, 0, nextW, nextH);
    canvas.width = nextW;
    canvas.height = nextH;
    ctx.drawImage(scaled, 0, 0);
    // Fresh attempt at better quality after resize.
    quality = START_QUALITY;
  }

  // Absolute fallback: best smallest encode we produced at floor size,
  // even if it still exceeds maxBytes (browser cannot do better).
  if (!best) {
    const blob = await canvasToBlob(canvas, encodeOrder[0], MIN_QUALITY);
    if (!blob) throw new ImageValidationError(IMAGE_ERROR_MESSAGE);
    best = { blob, mime: encodeOrder[0] };
  }

  const { blob, mime } = best;
  const ext = extForMime(mime);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "gambar";
  const compressedFile = new File([blob], `${baseName}.${ext}`, { type: mime });
  return { file: compressedFile, mime, size: blob.size, ext };
}

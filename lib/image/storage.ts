/**
 * Centralized Supabase Storage lifecycle for image uploads.
 *
 * Every image upload/delete in the app MUST go through this service:
 *  - uploadImageCompressed: compress locally (see compressImage.ts) → upload
 *    the compressed result → return path + public URL. The original file is
 *    never uploaded.
 *  - resolveStorageRef: derive { bucket, path } from any stored image_url
 *    (public URL / signed URL / bare "bucket/path" string). No fragile
 *    guesswork: only exact bucket matches are accepted.
 *  - deleteStorageObject / deleteStorageObjects: the ONLY sanctioned way to
 *    remove storage objects (no scattered supabase.storage.remove calls).
 *
 * Storage policies (Supabase/005): uploads go to `${auth.uid()}/...` and are
 * restricted to teacher/admin; deletes allowed for own folder or admin.
 */

import { createClient } from "@/lib/supabase/client";
import { compressImage, IMAGE_ERROR_MESSAGE, ImageValidationError, IMAGE_MAX_BYTES } from "./compressImage";

/** Buckets that hold user-uploaded images in this app. */
export const IMAGE_BUCKETS = ["question-images", "materi-images", "budaya-images"] as const;
export type ImageBucket = (typeof IMAGE_BUCKETS)[number];

export type UploadedImage = {
  /** Storage path inside the bucket, e.g. `${userId}/${id}-${ts}.webp`. */
  path: string;
  /** Public URL to persist in the DB image_url column. */
  publicUrl: string;
  bucket: ImageBucket;
  size: number;
};

export type StorageRef = { bucket: ImageBucket; path: string };

/**
 * Resolve a stored image reference to an exact { bucket, path }.
 * Accepts:
 *  - full public URL:  https://<proj>.supabase.co/storage/v1/object/public/<bucket>/<path>
 *  - signed/render URL: .../storage/v1/object/sign/<bucket>/<path>?token=...
 *  - bare reference:    "<bucket>/<path>"
 * Returns null for external URLs / unrecognizable values → caller must not
 * attempt storage deletion for those.
 */
export function resolveStorageRef(url: string | null | undefined): StorageRef | null {
  if (!url) return null;
  try {
    let decoded: URL | null = null;
    try {
      decoded = new URL(url);
    } catch {
      decoded = null;
    }
    if (decoded) {
      const marker = "/storage/v1/object/";
      const idx = decoded.pathname.indexOf(marker);
      if (idx >= 0) {
        const rest = decodeURIComponent(decoded.pathname.slice(idx + marker.length));
        // rest is like "public/<bucket>/<path>" or "sign/<bucket>/<path>?..."
        const withoutMode = rest.replace(/^(public|sign|authenticated)\//, "").split("?")[0];
        const bucket = withoutMode.split("/")[0];
        const path = withoutMode.slice(bucket.length + 1);
        if (isImageBucket(bucket) && path) return { bucket, path };
      }
      return null; // external URL → nothing to delete in our storage
    }
  } catch {
    return null;
  }
  // Bare "bucket/path" string (legacy data safety net)
  const bare = url.split("?")[0];
  const bucket = bare.split("/")[0];
  const path = bare.slice(bucket.length + 1);
  if (isImageBucket(bucket) && path) return { bucket, path };
  return null;
}

export function isImageBucket(bucket: string): bucket is ImageBucket {
  return (IMAGE_BUCKETS as readonly string[]).includes(bucket);
}

/**
 * Compress + upload. Never uploads the original bytes when the file exceeds
 * maxBytes; the caller persists `publicUrl` and may keep `path` for deletion.
 * Throws ImageValidationError (user-friendly message) on processing failure,
 * or the raw storage error on upload failure (caller decides UX).
 *
 * `subfolder` (opsional) menata objek di dalam folder user, mis. "content"
 * untuk gambar inline artikel vs cover di root: `${userId}/content/...`.
 */
export async function uploadImageCompressed(
  file: File,
  opts: { bucket: ImageBucket; userId: string; entityKey: string; maxBytes?: number; subfolder?: string }
): Promise<UploadedImage> {
  const { bucket, userId, entityKey, maxBytes = IMAGE_MAX_BYTES } = opts;
  // Hanya izinkan nama folder sederhana (hindari path traversal).
  const subfolder = opts.subfolder && /^[a-zA-Z0-9_-]+$/.test(opts.subfolder) ? `${opts.subfolder}/` : "";
  const supabase = createClient();

  let compressed;
  try {
    compressed = await compressImage(file, maxBytes);
  } catch (err) {
    if (err instanceof ImageValidationError) throw err;
    throw new ImageValidationError(IMAGE_ERROR_MESSAGE);
  }

  const path = `${userId}/${subfolder}${entityKey}-${Date.now()}.${compressed.ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, compressed.file, {
    upsert: false,
    contentType: compressed.mime,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl, bucket, size: compressed.size };
}

/**
 * Best-effort delete of storage objects. Never throws — failures are logged
 * with enough context (bucket + path) to be retried/cleaned up manually.
 * Returns the refs that FAILED to be deleted (retryable set).
 */
export async function deleteStorageObjects(refs: Array<StorageRef | null>): Promise<StorageRef[]> {
  const valid = refs.filter((r): r is StorageRef => r !== null);
  if (!valid.length) return [];

  const supabase = createClient();
  const byBucket = new Map<ImageBucket, string[]>();
  for (const ref of valid) {
    const list = byBucket.get(ref.bucket) || [];
    list.push(ref.path);
    byBucket.set(ref.bucket, list);
  }

  const failed: StorageRef[] = [];
  for (const [bucket, paths] of byBucket) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) {
      console.error("[storage-cleanup] gagal hapus objek (perlu retry manual):", {
        bucket,
        paths,
        message: error.message,
      });
      for (const p of paths) failed.push({ bucket, path: p });
    }
  }
  return failed;
}

/** Single-object convenience wrapper. Returns true when deletion succeeded. */
export async function deleteStorageObject(ref: StorageRef | null): Promise<boolean> {
  const failed = await deleteStorageObjects([ref]);
  return failed.length === 0;
}

/**
 * Delete stored image(s) referenced by image_url value(s).
 * Silently skips external/unresolvable URLs.
 */
export async function deleteStoredImageByUrl(url: string | null | undefined): Promise<boolean> {
  return deleteStorageObject(resolveStorageRef(url));
}

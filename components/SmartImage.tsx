"use client";

import Image from "next/image";
import { useState } from "react";

function isRemote(path: string) {
  return path.startsWith("http://") || path.startsWith("https://");
}

/**
 * Satu komponen untuk semua gambar aplikasi:
 * - Path lokal (/Asset/...) dan https → next/image (KOMPRES otomatis via
 *   image optimizer; sumber 87MB PNG kini dikirim sebagai WebP kecil).
 * - Protokol lain (http, data:, blob:, dst.) → <img> biasa, perilaku lama.
 *
 * - `fill` (default): parent WAJIB punya tinggi (fixed/aspect) — dipakai di
 *   semua kartu & hero yang sudah punya container berukuran.
 * - `fill={false}`: gambar alami, ikut lebar container (butuh width/height
 *   intrinsik next/image — dipakai lewat fallback <img> saja).
 */
export function SmartImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "100vw",
  fill = true,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const canOptimize = !failed && (src.startsWith("/") || isRemote(src));

  if (canOptimize && fill) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

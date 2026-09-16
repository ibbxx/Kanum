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
 *
 * Gagal bertahap: optimizer gagal → <img> langsung ke sumber asli (mis. format
 * yang tidak didukung optimizer); sumber asli juga gagal (objek storage sudah
 * tidak ada) → kotak netral, BUKAN ikon gambar rusak. `image_url` di DB bisa
 * menunjuk objek yang sudah dihapus, dan tanpa tahap terakhir itu kartu siswa
 * menampilkan gambar rusak.
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
  const [dead, setDead] = useState(false);

  // Sumber benar-benar tidak bisa dimuat — pertahankan kotak (className) supaya
  // tata letak tidak ambruk, tanpa ikon gambar rusak.
  if (dead) {
    if (!fill) return null;
    return <div className={className} role="img" aria-label={alt} />;
  }

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
      onError={() => setDead(true)}
    />
  );
}

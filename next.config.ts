import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * Pemisahan direktori output dev vs build.
 *
 * SEBELUMNYA: dev & build memakai `.next` yang sama. `next build` menulis
 * ulang/menghapus aset di sana, sehingga dev server kehilangan chunk CSS/JS
 * yang sedang dipakai (`/_next/static/css/app/layout.css`,
 * `/_next/static/chunks/main-app.js`, dst) → halaman tampil tanpa CSS/JS,
 * aset 404, dan dev server harus di-restart.
 *
 * SEKARANG: `distDir` dipilih berdasarkan fase Next:
 *   - `next dev`            → `.next-dev`
 *   - `next build` / `start`→ `.next`
 * Keduanya berdiri sendiri; build tidak menyentuh output dev dan sebaliknya.
 *
 * `phase` adalah fase Next (`phase-development-server`,
 * `phase-production-build`, `phase-production-server`, ...). Selain fase dev
 * (termasuk build & start produksi/Vercel) tetap memakai default `.next`,
 * jadi perilaku deploy tidak berubah.
 */
export default function config(phase: string): NextConfig {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",

    // Optimizer aktif (sebelumnya unoptimized: true — 87MB PNG dikirim mentah).
    // sharp sudah ada di lockfile. remotePatterns diizinkan luas supaya
    // image_url dari DB (path lokal maupun URL eksternal) tetap tampil,
    // sama seperti perilaku <img> sebelumnya.
    images: {
      remotePatterns: [{ protocol: "https", hostname: "**" }],

      // Gambar konten/cover nyaris tidak pernah berubah. Default Next hanya
      // `public, max-age=60, must-revalidate` → browser mengirim ulang
      // permintaan optimizer setiap menit (dan setiap navigasi setelah itu).
      // Hasil optimizer sudah content-addressed per (url, w, q) di server, jadi
      // cache panjang ini aman: isi gambar yang berubah selalu datang dari URL
      // storage baru (name unik), bukan dari path lama.
      minimumCacheTTL: 31536000, // 1 tahun

      // Varian yang berguna saja. Default 2048 & 3840 hanya menghasilkan
      // encode raksasa dari sumber yang lebarnya <= ~2000px (tidak menambah
      // detail, hanya menambah kerja server + byte).
      deviceSizes: [640, 750, 828, 1080, 1200, 1920],
      imageSizes: [128, 256, 384],
    },

    // Aset statis di /public TIDAK content-addressed (nama tetap walau isi
    // berubah), jadi Next menyajikannya dengan `Cache-Control: public,
    // max-age=0` → font ikon 314kB & PNG besar diminta ULANG setiap kunjungan.
    // Font & gambar di folder ini praktis immutable: selalu ditimpa dengan nama
    // baru bila berubah, dan gambar yang di-upload admin selalu masuk ke URL
    // storage (bukan ke /Asset). Cache panjang menghapus permintaan berulang
    // untuk berkas yang sama sekali tidak berubah.
    async headers() {
      return [
        {
          source: "/Asset/:path*",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        {
          source: "/fonts/:path*",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
      ];
    },

    outputFileTracingRoot: process.cwd(),
  };
}

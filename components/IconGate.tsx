"use client";

import { useEffect, useState } from "react";

/**
 * Font ikon Material Symbols dimuat lewat @font-face lokal (glyph-only,
 * ±10 kB setelah subset). Kelas `icons-ready` dipasang begitu FONT IKON siap
 * sehingga kode ligature tidak tampil sebagai teks mentah (FOUC), lalu glyph
 * muncul serentak. Jika font gagal dimuat, kode ligature tetap terlihat
 * (fallback yang tetap informatif).
 *
 * SEBELUMNYA: penungguan memakai `document.fonts.ready` — promise itu selesai
 * setelah SELURUH font di halaman selesai dimuat, termasuk dua font teks
 * variabel (Plus Jakarta Sans + Inter, ±75 kB) yang di-preload. Akibatnya
 * ikon tidak terlihat sampai font teks terbesar selesai, walau font ikonnya
 * sendiri sudah siap jauh lebih dulu (dan kelas ini baru dipasang setelah
 * hidrasi JS). Sekarang yang ditunggu hanya face font ikon itu sendiri
 * (`FontFaceSet.check`/`load`) — jaminan anti-FOUC tetap sama, ikon muncul
 * lebih awal.
 */
const ICON_FONT = '24px "Material Symbols Outlined"';

export function IconGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Guard runtime tetap dipertahankan untuk browser lama yang belum punya
    // Font Loading API — tanpa perlu cast bentuk window/document.
    let fonts: FontFaceSet | undefined;
    try {
      fonts = document.fonts;
    } catch {
      fonts = undefined;
    }
    if (!fonts?.ready) {
      setReady(true);
      return;
    }
    let alive = true;
    const done = () => {
      if (alive) setReady(true);
    };
    // Sudah tersedia (font ter-cache dari kunjungan sebelumnya) → tidak perlu
    // menunggu apa pun.
    if (typeof fonts.check === "function" && fonts.check(ICON_FONT)) {
      done();
      return () => {
        alive = false;
      };
    }
    if (typeof fonts.load === "function") {
      fonts.load(ICON_FONT).then(done, () => fonts?.ready.then(done, done));
    } else {
      fonts.ready.then(done, done);
    }
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (ready) {
      document.documentElement.classList.add("icons-ready");
    }
  }, [ready]);

  return null;
}

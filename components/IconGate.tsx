"use client";

import { useEffect, useState } from "react";

/**
 * Font ikon Material Symbols dimuat via CDN (glyph-only, kecil). Kelas
 * `material-symbols-outlined-loaded` dipasang begitu font siap sehingga
 * kode ligature tidak tampil sebagai teks mentah (FOUC), lalu glyph
 * muncul serentak. Jika font gagal dimuat, kode ligature tetap terlihat
 * (fallback yang tetap informatif).
 */
export function IconGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const anyWindow = window as unknown as {
      document?: { fonts?: { ready: Promise<FontFaceSet> } };
    };
    const fonts = anyWindow.document?.fonts;
    if (!fonts) {
      setReady(true);
      return;
    }
    let alive = true;
    fonts.ready
      .then(() => {
        if (alive) setReady(true);
      })
      .catch(() => {
        if (alive) setReady(true);
      });
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

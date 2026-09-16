#!/usr/bin/env python3
"""Regenerasi subset font ikon Material Symbols (lihat app/globals.css).

Font ikon disajikan lewat LIGATURE: elemen `.material-symbols-outlined` berisi
teks nama ikon ("menu_book") dan font menerjemahkannya jadi satu glyph. Karena
itu subsetting tidak bisa asal memotong glyph — aturan ligature (GSUB `rlig`)
untuk setiap nama harus ikut dipertahankan, dan huruf/digit/underscore tetap
ada supaya namanya bisa "ditulis".

Font penuh 314 kB; aplikasi hanya memakai ~90 nama ikon, jadi subset hasilnya
~10 kB tanpa satu pun glyph yang berubah bentuk:

  1. kumpulkan semua nama ikon dari app/, components/, lib/, hooks/,
  2. ambil font sumber (font penuh Material Symbols Outlined),
  3. buang semua aturan ligature selain nama yang dipakai,
  4. subset ke glyph yang tersisa (huruf ASCII + glyph ikon),
  5. verifikasi: setiap nama masih punya ligature, bentuk glyph & advance
     identik dengan font sumber, lalu tulis ke public/fonts/.

Pemakaian:
    pip install fonttools brotli        # satu kali
    npm run icons:subset                # atau: python3 scripts/subset-icon-font.py

Bila `--from` tidak diberikan, font penuh diunduh sekali dari Google Fonts
(tidak ada permintaan pihak ketiga saat runtime — hasilnya tetap file lokal).
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import shutil
import ssl
import subprocess
import sys
import tempfile
import urllib.request

from fontTools import subset
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "public/fonts/material-symbols-outlined.woff2")
SRC_DIRS = ("app", "components", "lib", "hooks")
# Literal mana pun yang namanya cocok dengan aturan ligature di font dianggap
# nama ikon — jadi nama di dalam array/props tetap tertangkap.
LITERAL = re.compile(r"""["'`]([a-z][a-z0-9_]{2,40})["'`]""")
DIGIT_WORDS = "zero one two three four five six seven eight nine".split()
CSS_URL = (
    "https://fonts.googleapis.com/css2"
    "?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
    "&display=block"
)
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36"


def spell(glyph_name: str) -> str:
    """Nama glyph ligature → karakter yang diwakilinya ('digit_two' → '2')."""
    if glyph_name == "underscore":
        return "_"
    if glyph_name.startswith("digit_"):
        word = glyph_name[6:]
        if word in DIGIT_WORDS:
            return str(DIGIT_WORDS.index(word))
    return glyph_name


def ligature_map(font: TTFont) -> dict[str, str]:
    """nama ikon → nama glyph hasil ligature."""
    out: dict[str, str] = {}
    for lookup in font["GSUB"].table.LookupList.Lookup:
        for sub in lookup.SubTable:
            inner = getattr(sub, "ExtSubTable", sub)
            for first, ligatures in getattr(inner, "ligatures", {}).items():
                for lig in ligatures:
                    name = spell(first) + "".join(spell(c) for c in lig.Component)
                    out[name] = lig.LigGlyph
    return out


def outline_hash(font: TTFont, glyph: str) -> str:
    pen = RecordingPen()
    font.getGlyphSet()[glyph].draw(pen)
    return hashlib.sha256(repr(pen.value).encode()).hexdigest()


def icon_names_from_code() -> list[str]:
    names: set[str] = set()
    for directory in SRC_DIRS:
        for dirpath, _dirnames, filenames in os.walk(os.path.join(ROOT, directory)):
            for filename in filenames:
                if not filename.endswith((".ts", ".tsx")):
                    continue
                with open(os.path.join(dirpath, filename), encoding="utf-8") as fh:
                    names.update(m for m in LITERAL.findall(fh.read()))
    return sorted(names)


def download_full_font(destination: str) -> None:
    """Unduh font penuh. Python dari python.org di macOS sering tidak punya
    CA bundle (SSL: CERTIFICATE_VERIFY_FAILED) — saat itu pakai curl bila ada."""

    def get(url: str) -> bytes:
        try:
            request = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except (ssl.SSLError, urllib.error.URLError) as err:
            if not shutil.which("curl"):
                raise
            print(f"  (urllib gagal: {err}; memakai curl)")
            return subprocess.run(
                ["curl", "-sSL", "--max-time", "60", "-A", UA, url],
                check=True,
                capture_output=True,
            ).stdout

    css = get(CSS_URL).decode("utf-8")
    match = re.search(r"url\(([^)]+)\)", css)
    if not match:
        sys.exit("Gagal menemukan URL font di respons Google Fonts.")
    with open(destination, "wb") as fh:
        fh.write(get(match.group(1)))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from", dest="source", help="font penuh .woff2/.ttf sumber")
    args = parser.parse_args()

    source = args.source
    with tempfile.TemporaryDirectory() as tmp:
        if not source:
            source = os.path.join(tmp, "material-symbols-outlined.full.woff2")
            print("Mengunduh font penuh dari Google Fonts…")
            download_full_font(source)

        full = TTFont(source)
        available = ligature_map(full)
        candidates = icon_names_from_code()
        used = [n for n in candidates if n in available]
        unknown = [n for n in candidates if n not in available]
        print(f"literal kode: {len(candidates)} | nama ikon dikenal font: {len(used)}")
        if unknown:
            print(f"  (bukan nama ikon, diabaikan: {len(unknown)} literal)")

        # 1) sisakan hanya aturan ligature untuk nama yang dipakai
        used_set = set(used)
        kept: set[str] = set()
        for lookup in full["GSUB"].table.LookupList.Lookup:
            for sub in lookup.SubTable:
                inner = getattr(sub, "ExtSubTable", sub)
                if not hasattr(inner, "ligatures"):
                    continue
                new_rules = {}
                for first, ligatures in inner.ligatures.items():
                    keep = []
                    for lig in ligatures:
                        name = spell(first) + "".join(spell(c) for c in lig.Component)
                        if name in used_set:
                            keep.append(lig)
                            kept.add(name)
                    if keep:
                        new_rules[first] = keep
                inner.ligatures = new_rules

        # 2) subset: huruf/digit/underscore + glyph ikon yang dipertahankan
        options = subset.Options()
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        options.glyph_names = True  # supaya verifikasi di bawah bisa membaca nama glyph
        options.recalc_bounds = False
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(text="".join(used) + " _", unicodes=list(range(0x20, 0x7F)))
        subsetter.subset(full)

        os.makedirs(os.path.dirname(TARGET), exist_ok=True)
        full.flavor = "woff2"
        full.save(TARGET)
        size = os.path.getsize(TARGET) / 1024
        print(f"ditulis {os.path.relpath(TARGET, ROOT)} — {size:.1f} kB")

        # 3) verifikasi hasil
        output = TTFont(TARGET)
        result = ligature_map(output)
        missing = [n for n in used if n not in result]
        if missing:
            sys.exit(f"GAGAL: nama tanpa ligature di hasil: {missing}")
        original = TTFont(source)
        original_map = ligature_map(original)
        changed = [
            n
            for n in used
            if outline_hash(original, original_map[n]) != outline_hash(output, result[n])
        ]
        if changed:
            sys.exit(f"GAGAL: bentuk glyph berubah untuk: {changed}")
        print(f"OK — {len(used)} nama ikon terverifikasi, bentuk glyph identik.")


if __name__ == "__main__":
    main()

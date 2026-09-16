/**
 * Allowlist sanitizer untuk HTML konten materi/budaya.
 *
 * Konten ditulis admin lewat WYSIWYG editor (TipTap) dan disimpan ke
 * `content_html`. Sebelum HTML itu dipakai — masuk editor, di-preview di
 * admin, atau dirender di halaman siswa (`dangerouslySetInnerHTML`) — ia
 * dibersihkan di sini:
 *  - hanya tag allowlist yang lolos; tag lain dibuang,
 *  - konten <script>/<style>/<iframe>/... dibuang BERSAMA tag-nya,
 *  - atribut dibatasi allowlist (on*, style, dst. dibuang),
 *  - href/src hanya http(s) absolut atau path relatif (javascript:, data:
 *    non-image, dst. ditolak),
 *  - teks & nilai atribut di-escape; entity valid (&nbsp; &amp; &#160;)
 *    tetap dipertahankan.
 *
 * Tanpa dependency eksternal — parser berbasis tokenizer regex sederhana;
 * cukup untuk HTML yang dihasilkan editor, bukan parsing dokumen arbitrer.
 */

/** Tag yang boleh lewat (konsisten dengan schema TipTap StarterKit). */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "code",
  "pre",
  "span",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption",
  "mark",
  "sup",
  "sub",
]);

/** Tag yang kontennya ikut dibuang (bukan hanya tag-nya). */
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "object",
  "embed",
  "noscript",
  "template",
  "svg",
  "math",
  "form",
  "input",
  "button",
  "select",
  "textarea",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

/** Atribut yang boleh lewat + pola nilai yang diizinkan. */
const SAFE_ATTRS: Record<string, RegExp> = {
  href: /^(https?:\/\/|\/)/i,
  // blob: diperbolehkan SEMENTARA untuk preview staged upload di editor
  // (blob URL tidak pernah tersimpan — diganti URL storage saat Save).
  // data:/base64 dilarang keras → gambar selalu disimpan sebagai URL storage.
  src: /^(https?:\/\/|\/|blob:)/i,
  // Hasil crop: gambar turunan yang sudah di-upload ke storage.
  "data-crop-src": /^(https?:\/\/|\/)/i,
  alt: /^[\s\S]{0,500}$/,
  title: /^[\s\S]{0,300}$/,
  class: /^[a-zA-Z0-9 _-]{0,200}$/,
  // Alignment gambar konten dari editor (left/center/right).
  "data-align": /^(left|center|right)$/,
  // Warna highlight (TipTap Highlight multicolor → <mark data-color>).
  "data-color": /^#[0-9a-fA-F]{3,8}$/,
  // Layout posisi gambar: inline / center / float-left / float-right.
  "data-layout": /^(inline|center|float-left|float-right)$/,
  // Caption gambar (disimpan sebagai atribut img; dirender oleh CSS/figure).
  "data-caption": /^[\s\S]{0,300}$/,
  // Ukuran eksplisit dalam px (dari resize handle editor).
  width: /^\d{1,4}$/,
  height: /^\d{1,4}$/,
  target: /^(_blank|_self)$/,
  rel: /^[a-zA-Z0-9 -]{0,100}$/,
};

/**
 * Inline style DIBATASI ketat: hanya warna teks & highlight.
 * Deklarasi lain (position, url(), expression, dst.) dibuang.
 *
 * Pola bersifat KONSTAN, jadi dikompilasi SEKALI di module scope: sebelumnya
 * `new RegExp(...)` dijalankan untuk setiap atribut style (per span berwarna
 * /highlight) — kompilasi regex berulang yang membebani tiap ketikan di
 * editor dan tiap penyimpanan konten.
 */
const STYLE_VALUE =
  "#[0-9a-fA-F]{3,8}|rgba?\\(\\s*\\d{1,3}(\\.\\d+)?\\s*,\\s*\\d{1,3}(\\.\\d+)?\\s*,\\s*\\d{1,3}(\\.\\d+)?(\\s*,\\s*(0|1|0?\\.\\d+)\\s*)?\\)|[a-zA-Z]{3,20}";
const STYLE_DECL = new RegExp(
  `^(color|background-color|text-align)\\s*:(\\s*(${STYLE_VALUE})|\\s*(left|center|right|justify))\\s*;?$`,
  "i",
);

function sanitizeStyle(raw: string): string {
  return raw
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d && STYLE_DECL.test(d))
    .map((d) => (d.endsWith(";") ? d : d + ";"))
    .join(" ");
}

/** Escape teks bebas; entity valid tetap dipertahankan. */
function escapeText(s: string): string {
  return s
    .replace(/&(?![a-zA-Z#][a-zA-Z0-9]{0,7};)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&(?![a-zA-Z#][a-zA-Z0-9]{0,7};)/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Filter atribut sebuah tag pembuka; kembalikan string atribut ("" jika kosong). */
function sanitizeAttrs(attrs: string): string {
  const out: string[] = [];
  const RE =
    /([a-zA-Z_:][a-zA-Z0-9_:.-]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|[^\s"'=<>`]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(attrs))) {
    const name = (m[1] ?? "").toLowerCase();
    // Nilai quoted ditangkap di grup 3/4 (tanpa tanda kutip); unquoted di grup 2.
    const raw =
      m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : (m[2] ?? "");
    if (name.startsWith("on")) continue; // onerror/onclick/onload/... selalu dibuang
    if (name === "style") {
      const clean = sanitizeStyle(raw);
      if (clean) out.push(`style="${escapeAttr(clean)}"`);
      continue;
    }
    const rule = SAFE_ATTRS[name];
    if (!rule || !rule.test(raw)) continue;
    out.push(`${name}="${escapeAttr(raw)}"`);
  }
  return out.length ? " " + out.join(" ") : "";
}

/**
 * Kumpulkan semua src <img> yang valid dari sebuah HTML (termasuk blob).
 * Dipakai untuk: diff image lama vs baru saat Save (cleanup storage),
 * dan penghapusan upload yang gagal tersimpan (orphan protection).
 */
export function extractImageSrcs(html: string): string[] {
  if (!html) return [];
  const out: string[] = [];
  const RE = /<img\b[^>]*?\bsrc\s*=\s*("([^"]*)"|'([^']*)'|[^\s"'=<>`]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(html))) {
    const src = (m[2] ?? m[3] ?? m[1] ?? "").trim();
    if (src) out.push(src);
  }
  return out;
}

/**
 * Bungkus <img> ber-caption menjadi <figure><img/><figcaption>…</figcaption></figure>
 * untuk rendering (preview admin & halaman siswa). Aman dipanggil berulang:
 * img yang sudah di dalam figure tidak diproses lagi.
 */
export function decorateCaptions(html: string): string {
  if (!html || !html.includes("data-caption")) return html;
  return html.replace(
    /<img\b([^>]*?\bdata-caption\s*=\s*"([^"]*)"([^>]*?))\s*\/??>\s*/gi,
    (_m, attrs: string, caption: string, rest: string) => {
      // Hoist layout gambar ke figure agar float tetap mengalirkan teks.
      const layout = /\bdata-layout\s*=\s*"([^"]*)"/.exec(rest)?.[1] ?? "";
      return `<figure class="imgfig"${layout ? ` data-layout="${layout}"` : ""}><img${attrs}><figcaption>${caption}</figcaption></figure>`;
    },
  );
}

/**
 * Bersihkan HTML mentah menjadi HTML aman (allowlist).
 * Output siap dipakai untuk editor/preview/render siswa.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  // Token: komentar HTML | tag (<, tag name, attrs, self-close) | teks bebas.
  const TOKEN =
    /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*)(\/?)>|([^<]+)/g;
  let out = "";
  // Stack tag yang kontennya dibuang (mis. sedang di dalam <script>).
  const skipping: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(dirty))) {
    const full = m[0];
    const name = (m[1] ?? "").toLowerCase();
    const attrs = m[2] ?? "";
    const selfClose = m[3] ?? "";
    const text = m[4];

    if (text !== undefined) {
      if (skipping.length === 0) out += escapeText(text);
      continue;
    }

    if (skipping.length > 0) {
      // Di dalam konten terlarang: hanya penutup yang cocok mengakhiri skip.
      if (full.startsWith("</") && name === skipping[skipping.length - 1]) {
        skipping.pop();
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(name)) {
      if (!full.startsWith("</") && DROP_WITH_CONTENT.has(name) && !selfClose) {
        skipping.push(name);
      }
      continue; // tag lain dibuang, teks di dalamnya tetap (ter-escape)
    }

    if (full.startsWith("</")) {
      out += `</${name}>`;
      continue;
    }
    if (VOID_TAGS.has(name)) {
      out += `<${name}${sanitizeAttrs(attrs)}>`;
      continue;
    }
    out += `<${name}${sanitizeAttrs(attrs)}${selfClose ? " /" : ""}>`;
  }
  return out;
}

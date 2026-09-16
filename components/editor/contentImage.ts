import TiptapImage from "@tiptap/extension-image";

/**
 * Ekstensi gambar konten: atribut tambahan untuk layout, ukuran, caption,
 * dan sumber gambar asli sebelum crop.
 *
 * Semua atribut ditulis sebagai `data-*` (kecuali width/height) supaya
 * allowlist `lib/sanitize-html.ts` meloloskannya saat HTML disimpan — dan
 * tetap terbaca lagi saat konten lama dibuka di editor.
 */
export const ContentImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute("width");
          return w && /^\d{1,4}$/.test(w) ? Number(w) : null;
        },
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.width ? { width: attrs.width } : {},
      },
      height: {
        default: null,
        parseHTML: (el) => {
          const h = el.getAttribute("height");
          return h && /^\d{1,4}$/.test(h) ? Number(h) : null;
        },
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.height ? { height: attrs.height } : {},
      },
      textAlign: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-align") ?? "center",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-align": attrs.textAlign,
        }),
      },
      layout: {
        default: "inline",
        parseHTML: (el) => el.getAttribute("data-layout") ?? "inline",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-layout": attrs.layout,
        }),
      },
      caption: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-caption"),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.caption ? { "data-caption": attrs.caption } : {},
      },
      cropSrc: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-crop-src"),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.cropSrc ? { "data-crop-src": attrs.cropSrc } : {},
      },
    };
  },
});

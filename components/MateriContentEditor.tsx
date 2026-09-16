"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
// Color dari paket ini yang menyediakan command setColor/unsetColor —
// TextStyle dasar TIDAK memilikinya (root cause error
// "editor.chain(...).unsetColor is not a function" bila Color tak terdaftar).
import { TextStyle, Color } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import type { EditorView } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";
import { Icon } from "@/components/Icon";
import { ActionButton } from "@/components/admin/ui";
import { sanitizeHtml, decorateCaptions } from "@/lib/sanitize-html";

type Props = {
  /** HTML (tersanitasi) dari/ke `content_html`. */
  value: string;
  /** Dipanggil dengan HTML bersih hasil editor setiap perubahan. */
  onChange: (html: string) => void;
  /** Placeholder editor saat kosong (default: konten materi). */
  placeholder?: string;
  /**
   * Dipanggil setiap admin menyisipkan gambar perangkat (picker/paste/drop).
   * Item berisi blob URL yang TERTANAM di editor + file aslinya —
   * parent yang melakukan upload saat Save (staged upload).
   */
  onStaged?: (item: { blobUrl: string; file: File }) => void;
  /**
   * Upload file hasil crop via pipeline existing; resolve dengan URL storage.
   * Wajib supaya hasil crop tersimpan permanen (bukan sekadar CSS).
   */
  uploadForCrop?: (file: File) => Promise<string>;
};

/**
 * API imperatif untuk form modal (dipanggil saat Save):
 * - getImageSrcs: semua src img saat ini (termasuk blob:).
 * - getHtmlWithReplacements: HTML final — blob diganti URL storage
 *   (via map), blob yang tak ada di map dibuang dari konten.
 */
export type ContentEditorHandle = {
  getImageSrcs: () => string[];
  getHtmlWithReplacements: (map: Map<string, string>) => string;
};

/* ════════════════ Ekstensi gambar: layout + ukuran + crop ════════════════ */

const ContentImage = TiptapImage.extend({
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

/* ════════════════ NodeView: selected UI, resize, menu kontekstual ════════════════ */

type MenuAction =
  | { kind: "attr"; name: string; value: string | null }
  | { kind: "reset-size" }
  | { kind: "reset-crop" }
  | { kind: "delete" }
  | { kind: "crop" };

function imageNodeView(options: {
  editor: Editor;
  getPos: () => number | undefined;
  onCrop: (node: PMNode, pos: number) => void;
}) {
  const { editor, getPos, onCrop } = options;

  const wrap = document.createElement("span");
  wrap.className = "imgwrap";
  wrap.setAttribute("data-layout", "inline");

  const img = document.createElement("img");
  wrap.appendChild(img);

  // Resize handle (pointer events → mouse & touch sekaligus).
  const handle = document.createElement("span");
  handle.className = "imgresize";
  handle.title = "Tarik untuk mengubah ukuran";
  wrap.appendChild(handle);

  // Menu kontekstual (tampil saat gambar dipilih).
  const menu = document.createElement("div");
  menu.className = "imgmenu";
  wrap.appendChild(menu);

  let altOpen = false;
  let captionOpen = false;

  function applyAction(a: MenuAction) {
    const pos = getPos();
    if (pos === undefined) return;
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    if (a.kind === "attr") {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, [a.name]: a.value });
          return true;
        })
        .run();
    } else if (a.kind === "reset-size") {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: null, height: null });
          return true;
        })
        .run();
    } else if (a.kind === "reset-crop") {
      const orig = node.attrs.cropSrc as string | null;
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            src: orig ?? node.attrs.src,
            cropSrc: null,
          });
          return true;
        })
        .run();
    } else if (a.kind === "delete") {
      editor.chain().focus().deleteSelection().run();
    } else if (a.kind === "crop") {
      onCrop(node, pos);
    }
  }

  function renderMenu(attrs: Record<string, unknown>) {
    menu.innerHTML = "";
    const mk = (label: string, title: string, fn: () => void) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.title = title;
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", fn);
      return b;
    };
    menu.appendChild(mk("✂ Crop", "Crop gambar", () => applyAction({ kind: "crop" })));
    menu.appendChild(
      mk("⤺ Reset Crop", "Kembalikan gambar asli", () => applyAction({ kind: "reset-crop" })),
    );
    if (!altOpen) {
      menu.appendChild(
        mk("⚙ Alt", "Teks alternatif", () => {
          altOpen = true;
          renderMenu(attrs);
        }),
      );
    } else {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = "Teks alternatif…";
      inp.value = (attrs.alt as string) ?? "";
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          applyAction({ kind: "attr", name: "alt", value: (inp as HTMLInputElement).value || null });
          altOpen = false;
        }
        if (e.key === "Escape") altOpen = false;
      });
      menu.appendChild(inp);
      const ok = mk("✓", "Simpan alt", () => {
        applyAction({ kind: "attr", name: "alt", value: (inp as HTMLInputElement).value || null });
        altOpen = false;
      });
      menu.appendChild(ok);
    }
    if (!captionOpen) {
      menu.appendChild(
        mk("❝ Caption", "Keterangan gambar", () => {
          captionOpen = true;
          renderMenu(attrs);
        }),
      );
    } else {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = "Caption…";
      inp.value = (attrs.caption as string) ?? "";
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          applyAction({ kind: "attr", name: "caption", value: (inp as HTMLInputElement).value || null });
          captionOpen = false;
        }
        if (e.key === "Escape") captionOpen = false;
      });
      menu.appendChild(inp);
      const ok = mk("✓", "Simpan caption", () => {
        applyAction({ kind: "attr", name: "caption", value: (inp as HTMLInputElement).value || null });
        captionOpen = false;
      });
      menu.appendChild(ok);
    }
    const layout = (attrs.layout as string) ?? "inline";
    for (const [label, title, val, on] of [
      ["⇤", "Rata kiri", "left", (attrs.textAlign as string) === "left"],
      ["⇔", "Rata tengah", "center", (attrs.textAlign as string) === "center"],
      ["⇥", "Rata kanan", "right", (attrs.textAlign as string) === "right"],
      ["▚", "Inline", "inline", layout === "inline"],
      ["☰L", "Float kiri (teks mengalir)", "float-left", layout === "float-left"],
      ["R☰", "Float kanan (teks mengalir)", "float-right", layout === "float-right"],
      ["▣", "Blok tengah", "center", layout === "center"],
    ] as const) {
      const b = mk(label, title, () => {
        if (title === "Blok tengah" && layout === "center")
          return applyAction({ kind: "attr", name: "layout", value: "inline" });
        applyAction({ kind: "attr", name: title === "Rata kiri" || title === "Rata tengah" || title === "Rata kanan" ? "textAlign" : "layout", value: val });
      });
      if (on) b.classList.add("on");
      menu.appendChild(b);
    }
    menu.appendChild(mk("⟲", "Reset ukuran", () => applyAction({ kind: "reset-size" })));
    menu.appendChild(mk("🗑", "Hapus gambar", () => applyAction({ kind: "delete" })));
  }

  // Resize: drag sudut kanan-bawah, aspect ratio terjaga, commit ke attrs.
  // Listener move/up dipasang di WINDOW (bukan handle): pointer capture bisa
  // gagal/tidak aktif, dan tanpa itu pointer yang keluar dari handle 14px
  // membuat drag mati di tengah jalan.
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {
      /* pointer sintetis / sudah tidak aktif — window listener tetap bekerja */
    }
    const startW = img.getBoundingClientRect().width;
    const startX = e.clientX;
    const container = wrap.closest(".materi-editor");
    const maxW = Math.max(120, (container?.clientWidth ?? 640) - 16);
    const move = (ev: PointerEvent) => {
      const w = Math.min(maxW, Math.max(80, Math.round(startW + (ev.clientX - startX))));
      img.style.width = `${w}px`;
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const w = Math.min(maxW, Math.max(80, Math.round(startW + (ev.clientX - startX))));
      img.style.width = "";
      applyAction({ kind: "attr", name: "width", value: String(w) });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  });

  return {
    dom: wrap,
    update(node: PMNode) {
      if (node.type.name !== "image") return false;
      const attrs = node.attrs as Record<string, unknown>;
      img.src = (attrs.src as string) ?? "";
      img.alt = (attrs.alt as string) ?? "";
      img.draggable = true;
      if (attrs.width) img.style.width = `${attrs.width}px`;
      else img.style.width = "";
      wrap.setAttribute("data-layout", (attrs.layout as string) ?? "inline");
      wrap.setAttribute("data-align", (attrs.textAlign as string) ?? "center");
      // Caption di bawah gambar (pratinjau di editor).
      let cap = wrap.querySelector<HTMLElement>(".imgcap");
      if (attrs.caption) {
        if (!cap) {
          cap = document.createElement("span");
          cap.className = "imgcap";
          wrap.appendChild(cap);
        }
        cap.textContent = attrs.caption as string;
      } else if (cap) {
        cap.remove();
      }
      // Simpan attrs terbaru untuk menu.
      renderMenu(attrs);
      return true;
    },
    selectNode() {
      wrap.classList.add("selected");
    },
    deselectNode() {
      wrap.classList.remove("selected");
      altOpen = false;
      captionOpen = false;
    },
    ignoreMutation: () => true,
    destroy() {
      menu.remove();
      handle.remove();
    },
  };
}

/* ════════════════ Komponen utama ════════════════ */

const TEXT_COLORS = [
  "#121c28", "#003527", "#9a4614", "#ba1a1a", "#0b513d",
  "#712c00", "#1d4ed8", "#6d28d9", "#404944", "#707974",
];
const HL_COLORS = ["#ffe58a", "#b0f0d6", "#ffdbcb", "#d9e3f4", "#f3d1ff", "#e7f0c9"];

const MateriContentEditor = forwardRef<ContentEditorHandle, Props>(
  function MateriContentEditor({ value, onChange, placeholder, onStaged, uploadForCrop }, ref) {
    const [tab, setTab] = useState<"edit" | "preview">("edit");
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageOpen, setImageOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [colorOpen, setColorOpen] = useState(false);
    const [hlOpen, setHlOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [cropSrc, setCropSrc] = useState<{ src: string; alt: string } | null>(null);
    const moreRef = useRef<HTMLDivElement>(null);

    const onStagedRef = useRef(onStaged);
    useEffect(() => {
      onStagedRef.current = onStaged;
    }, [onStaged]);

    // Target crop aktif + bus event kecil (NodeView → React state).
    const cropTargetRef = useRef<{ node: PMNode | null; pos: number }>({
      node: null,
      pos: -1,
    });
    const cropBusRef = useRef<EventTarget | null>(null);
    if (!cropBusRef.current) cropBusRef.current = new EventTarget();

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4] },
          link: {
            openOnClick: false,
            autolink: true,
            defaultProtocol: "https",
            HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
          },
        }),
        // BLOCK-level image (tanpa `inline: true`): klik di antara dua paragraf
        // memecah blok di posisi kursor → "teks A / [gambar] / teks B" —
        // posisi gambar tersimpan apa adanya di document model. Image inline
        // di posisi non-valid justru terdorong ke akhir dokumen (bug lama).
        // allowBase64: false → data URI tidak akan pernah masuk dokumen.
        ContentImage.configure({ allowBase64: false }),
        TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right"] }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        Subscript,
        Superscript,
        Placeholder.configure({
          placeholder: placeholder ?? "Tulis materi pembelajaran di sini...",
        }),
      ],
      content: sanitizeHtml(value),
      editorProps: {
        attributes: {
          class: "prose-kanum materi-editor min-h-[280px] px-4 py-4 focus:outline-none sm:px-6 sm:py-5",
        },
        handlePaste: (view, event) => {
          const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
            f.type.startsWith("image/"),
          );
          if (files.length) {
            event.preventDefault();
            insertFilesAt(view, files);
            return true;
          }
          return false; // data-URI img ditolak schema (allowBase64: false)
        },
        handleDrop: (view, event) => {
          const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
            f.type.startsWith("image/"),
          );
          if (files.length) {
            event.preventDefault();
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            insertFilesAt(view, files, coords?.pos);
            return true;
          }
          return false;
        },
      },
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        onChange(sanitizeHtml(editor.isEmpty ? "" : editor.getHTML()));
      },
    });

    /**
     * Sisipkan file gambar (blob preview) pada posisi kursor/drop.
     * WAJIB lewat perintah TipTap (insertContentAt) — BUKAN tr.insert mentah —
     * agar insertion rules berjalan: paragraf di posisi kursor terpecah
     * sehingga urutan "teks A → [gambar] → teks B" terjaga, dan gambar
     * tidak pernah ter-append ke akhir dokumen.
     */
    const insertFilesAt = useCallback(
      (view: EditorView, files: File[], pos?: number) => {
        if (!editor) return;
        let current = pos ?? view.state.selection.from;
        for (const file of files) {
          // Tolak non-image di pintu masuk (jangan buat node dengan blob tidak valid).
          if (!file.type.startsWith("image/")) {
            console.warn("File dilewati (bukan gambar):", file.name, file.type);
            continue;
          }
          const blobUrl = URL.createObjectURL(file);
          const node = editor.state.schema.nodes.image.create({
            src: blobUrl,
            alt: file.name.slice(0, 120),
          });
          editor
            .chain()
            .insertContentAt(current, node, { updateSelection: true })
            .run();
          // Setelah insert, seleksi berada tepat setelah node →
          // gambar berikutnya menyambung di posisi yang benar.
          current = editor.state.selection.from;
          onStagedRef.current?.({ blobUrl, file });
        }
        editor.commands.focus();
      },
      [editor],
    );

    // Pasang NodeView gambar + listener crop (sekali, setelah editor siap).
    useEffect(() => {
      if (!editor) return;
      editor.registerPlugin(
        new Plugin({
          props: {
            nodeViews: {
              image: (node, _view, getPos) => {
                const nv = imageNodeView({
                  editor,
                  getPos: () => (typeof getPos === "function" ? getPos() : undefined),
                  onCrop: (n, p) => {
                    cropTargetRef.current = { node: n, pos: p };
                    cropBusRef.current?.dispatchEvent(new Event("kanum-crop"));
                  },
                });
                // ProseMirror TIDAK memanggil update() untuk nodeView yang baru
                // dibuat — attrs awal (src/width/align/caption) harus diterapkan
                // di sini, kalau tidak gambar hasil load konten lama tampil kosong.
                nv.update(node);
                return nv;
              },
            },
          },
        }),
      );
      const onCrop = () => {
        const t = cropTargetRef.current;
        const src = t.node?.attrs?.src as string | undefined;
        if (src) setCropSrc({ src, alt: (t.node?.attrs?.alt as string) ?? "" });
      };
      const bus = cropBusRef.current;
      bus?.addEventListener("kanum-crop", onCrop);
      return () => {
        bus?.removeEventListener("kanum-crop", onCrop);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor]);

    // Overflow menu mobile: tutup saat tap di luar / Escape.
    useEffect(() => {
      if (!moreOpen) return;
      const onDown = (e: MouseEvent | PointerEvent) => {
        if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMoreOpen(false);
      };
      document.addEventListener("pointerdown", onDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("pointerdown", onDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [moreOpen]);

    /**
     * Edge case: menu "More" dibuka di mobile lalu layar dilebarkan ≥640px.
     * Baris toolbar desktop sengaja di-unmount selama menu More terbuka
     * (mencegah dua salinan live popover/autofocus) sedangkan tombol More
     * disembunyikan di desktop — tanpa penutupan otomatis di sini, seluruh
     * toolbar desktop bisa hilang. Tutup menu begitu masuk breakpoint sm.
     */
    useEffect(() => {
      if (typeof window === "undefined" || !window.matchMedia) return;
      const mq = window.matchMedia("(min-width: 640px)");
      const onChange = () => {
        if (mq.matches) setMoreOpen(false);
      };
      onChange();
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }, []);

    // Sinkron konten eksternal → editor (form dibuka / ganti konten / reset).
    useEffect(() => {
      if (!editor) return;
      const incoming = sanitizeHtml(value);
      const current = editor.isEmpty ? "" : editor.getHTML();
      if (incoming !== current) {
        editor.commands.setContent(incoming, { emitUpdate: false });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, editor]);

    // API untuk parent (dipakai saat Save).
    useImperativeHandle(
      ref,
      () => ({
        getImageSrcs() {
          if (!editor || editor.isDestroyed) return [];
          return extractSrcs(editor.isEmpty ? "" : editor.getHTML());
        },
        getHtmlWithReplacements(map: Map<string, string>) {
          if (!editor || editor.isDestroyed) return "";
          // 1) Buang image blob yang tidak berhasil di-upload (tak ada di map).
          const toDelete: number[] = [];
          editor.state.doc.descendants((node, pos) => {
            if (
              node.type.name === "image" &&
              typeof node.attrs.src === "string" &&
              node.attrs.src.startsWith("blob:") &&
              !map.has(node.attrs.src)
            ) {
              toDelete.push(pos);
            }
          });
          for (const pos of toDelete.reverse()) {
            editor.view.dispatch(editor.state.tr.delete(pos, pos + 1));
          }
          // 2) Ganti blob → URL storage (posisi tidak berubah ukuran).
          editor.state.doc.descendants((node, pos) => {
            const src = node.attrs.src as string | undefined;
            if (node.type.name === "image" && src && map.has(src)) {
              editor.view.dispatch(
                editor.state.tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  src: map.get(src),
                }),
              );
            }
          });
          return editor.isEmpty ? "" : editor.getHTML();
        },
      }),
      [editor],
    );

    const setLink = useCallback(
      (url: string) => {
        if (!editor) return;
        const clean = url.trim();
        if (!clean) {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
        } else {
          const href = /^(https?:\/\/|\/)/i.test(clean) ? clean : `https://${clean}`;
          editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }
        setLinkOpen(false);
        setLinkUrl("");
      },
      [editor],
    );

    /** Sisipkan gambar dari URL eksternal (divalidasi, tanpa upload). */
    const insertFromUrl = useCallback(() => {
      if (!editor) return;
      const clean = imageUrl.trim();
      if (!/^(https?:\/\/|\/)/i.test(clean)) {
        setImageOpen(false);
        setImageUrl("");
        return;
      }
      editor.chain().focus().insertContent({ type: "image", attrs: { src: clean } }).run();
      setImageOpen(false);
      setImageUrl("");
    }, [editor, imageUrl]);

    /** Terapkan hasil crop: upload file → src baru + simpan src asli. */
    const applyCrop = useCallback(
      async (file: File) => {
        const t = cropTargetRef.current;
        if (!editor || t.pos < 0 || !t.node) return false;
        const origSrc = (t.node.attrs.cropSrc as string | null) ?? (t.node.attrs.src as string);
        let newUrl: string | null = null;
        try {
          if (uploadForCrop) newUrl = await uploadForCrop(file);
        } catch {
          newUrl = null;
        }
        if (!newUrl) return false; // upload gagal → dialog menampilkan error, gambar asli dipertahankan
        const pos = t.pos;
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, {
            ...t.node.attrs,
            src: newUrl,
            cropSrc: origSrc,
          }),
        );
        // Normal state setelah crop: keluar dari NodeSelection agar outline
        // selected hilang dan gambar hasil crop tampil seperti gambar biasa.
        editor.commands.setTextSelection(pos + 1);
        setCropSrc(null);
        return true;
      },
      [editor, uploadForCrop],
    );

    if (!editor) {
      return (
        <div className="h-[280px] animate-pulse rounded-2xl border border-outline-variant bg-surface-container-low" />
      );
    }

    /**
     * Grup format sekunder (heading, list, alignment, color, link, image).
     * JSX yang SAMA dirender di dua tempat: toolbar desktop (satu baris, wrap)
     * dan overflow menu "More" di mobile. Dipakai sebagai nilai JSX — bukan
     * komponen inline — supaya popover tidak remount (kehilangan fokus input)
     * tiap re-render saat mengetik.
     */
    const formatGroups = (
      <>
              <Group>
                <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)" icon="undo" />
                <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)" icon="redo" />
              </Group>
              <Group>
                <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)" label="B" bold />
                <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)" label="I" italic />
                <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)" label="U" underline />
                <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strike" label="S" strike />
                <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript" label="x²" />
                <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript" label="x₂" />
                <Btn
                  onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                  title="Bersihkan format"
                  icon="format_clear"
                />
              </Group>
              <Group>
                {(["p", "h1", "h2", "h3", "h4"] as const).map((h) => (
                  <Btn
                    key={h}
                    onClick={() =>
                      h === "p"
                        ? editor.chain().focus().setParagraph().run()
                        : editor.chain().focus().toggleHeading({ level: Number(h[1]) as 1 | 2 | 3 | 4 }).run()
                    }
                    active={h === "p" ? editor.isActive("paragraph") : editor.isActive("heading", { level: Number(h[1]) })}
                    title={h === "p" ? "Paragraf" : `Judul ${h.toUpperCase()}`}
                    label={h === "p" ? "¶" : h.toUpperCase()}
                  />
                ))}
              </Group>
              <Group>
                <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Daftar poin" icon="format_list_bulleted" />
                <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Daftar bernomor" icon="format_list_numbered" />
              </Group>
              <Group>
                <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Rata kiri" icon="format_align_left" />
                <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Rata tengah" icon="format_align_center" />
                <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Rata kanan" icon="format_align_right" />
                <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Kutipan" icon="format_quote" />
                <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Garis pemisah" icon="horizontal_rule" />
              </Group>
              <Group>
                <div className="relative">
                  <Btn
                    onClick={() => {
                      const existing = editor.getAttributes("link").href as string | undefined;
                      setLinkUrl(existing ?? "");
                      setImageOpen(false);
                      setColorOpen(false);
                      setHlOpen(false);
                      setLinkOpen((v) => !v);
                    }}
                    active={editor.isActive("link") || linkOpen}
                    title="Tautan"
                    icon="link"
                  />
                  {linkOpen && (
                    <Popover>
                      <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                        URL tautan (kosongkan untuk menghapus)
                      </label>
                      <PopoverRow value={linkUrl} onChange={setLinkUrl} onOk={() => setLink(linkUrl)} placeholder="contoh.com/topik" />
                    </Popover>
                  )}
                </div>
              </Group>
              <Group>
                <div className="relative">
                  <Btn
                    onClick={() => {
                      setHlOpen(false);
                      setLinkOpen(false);
                      setColorOpen((v) => !v);
                    }}
                    active={colorOpen}
                    title="Warna teks"
                    icon="format_color_text"
                  />
                  {colorOpen && (
                    <Popover>
                      <Swatches
                        colors={TEXT_COLORS}
                        onPick={(c) => {
                          editor.chain().focus().setColor(c).run();
                          setColorOpen(false);
                        }}
                        onClear={() => {
                          editor.chain().focus().unsetColor().run();
                          setColorOpen(false);
                        }}
                      />
                    </Popover>
                  )}
                </div>
                <div className="relative">
                  <Btn
                    onClick={() => {
                      setColorOpen(false);
                      setLinkOpen(false);
                      setHlOpen((v) => !v);
                    }}
                    active={hlOpen || editor.isActive("highlight")}
                    title="Highlight"
                    icon="format_color_fill"
                  />
                  {hlOpen && (
                    <Popover>
                      <Swatches
                        colors={HL_COLORS}
                        onPick={(c) => {
                          editor.chain().focus().toggleHighlight({ color: c }).run();
                          setHlOpen(false);
                        }}
                        onClear={() => {
                          editor.chain().focus().unsetHighlight().run();
                          setHlOpen(false);
                        }}
                      />
                    </Popover>
                  )}
                </div>
              </Group>
              <Group>
                <div className="relative">
                  <Btn
                    onClick={() => {
                      setLinkOpen(false);
                      setColorOpen(false);
                      setHlOpen(false);
                      setImageOpen((v) => !v);
                    }}
                    active={imageOpen}
                    title="Sisipkan Gambar"
                    icon="image"
                  />
                  {imageOpen && (
                    <Popover wide align="right">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-on-surface">
                        <Icon name="image" className="text-[16px] leading-none" />
                        Sisipkan Gambar
                      </p>
                      <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                        Upload dari perangkat (boleh pilih beberapa)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="w-full cursor-pointer rounded-lg border border-outline-variant px-2 py-2 text-xs file:mr-2 file:min-h-7 file:rounded-md file:border-0 file:bg-primary file:px-3 file:text-xs file:font-bold file:text-on-primary"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          e.target.value = "";
                          if (!files.length || !editor) return;
                          setImageOpen(false);
                          insertFilesAt(editor.view, files);
                        }}
                      />
                      <div className="my-2.5 flex items-center gap-2 text-[11px] text-on-surface-variant/70">
                        <span className="h-px flex-1 bg-outline-variant" />
                        atau
                        <span className="h-px flex-1 bg-outline-variant" />
                      </div>
                      <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                        Sisipkan gambar dari URL
                      </label>
                      <PopoverRow value={imageUrl} onChange={setImageUrl} onOk={insertFromUrl} placeholder="https://..." />
                      <p className="mt-1.5 text-[11px] text-on-surface-variant/70">
                        Upload diproses saat klik Simpan. Bisa juga drag &amp; drop atau paste (Ctrl+V).
                      </p>
                    </Popover>
                  )}
                </div>
              </Group>
      </>
    );

    return (
      <div className="min-w-0 rounded-2xl border border-outline-variant bg-white">
        {/* Bar atas: tab + toolbar.
            STICKY: konten panjang di mobile — toolbar selalu terjangkau tanpa
            scroll balik ke atas. SATU baris saja (aksi inti + menu More);
            sisa aksi tidak pernah menambah baris/tinggi toolbar.
            CATATAN: jangan beri overflow pada baris ini — overflow membuat
            baris jadi scroll container dan MEMOTONG popover/menu absolut. */}
        <div
          data-testid="editor-toolbar"
          className="sticky top-0 z-30 flex flex-nowrap flex-col rounded-t-2xl border-b border-outline-variant bg-surface-container-low shadow-sm"
        >
          <div className="flex flex-nowrap items-center gap-2 px-2 py-0.5 sm:px-3 sm:py-2">
            {/* Tab Edit/Preview: ikon saja di mobile (hemat ~35px), label di desktop.
                Tanpa padding dalam → tinggi grup 42px sehingga baris tetap ≤48px. */}
            <div className="flex shrink-0 items-center gap-0.5 overflow-hidden rounded-lg border border-outline-variant bg-white">
              {(["edit", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setMoreOpen(false);
                  }}
                  aria-label={t === "edit" ? "Edit konten" : "Pratinjau konten"}
                  title={t === "edit" ? "Edit konten" : "Pratinjau konten"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center gap-1 rounded-md text-xs font-bold transition-colors sm:h-auto sm:w-auto sm:px-3 sm:py-1 ${
                    tab === t
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Icon
                    name={t === "edit" ? "edit" : "visibility"}
                    className="h-[18px] w-[18px] shrink-0 sm:hidden"
                  />
                  <span className="hidden sm:inline">{t === "edit" ? "Edit" : "Preview"}</span>
                </button>
              ))}
            </div>

            {/* Aksi inti mobile — Undo, Redo, Bold, Italic, More. Tetap 1 baris
                (touch target 40px), semua aksi sekunder ada di dalam "More". */}
            {tab === "edit" && (
              <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:hidden">
                <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo" icon="undo" />
                <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo" icon="redo" />
                <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-outline-variant" />
                <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold" label="B" bold />
                <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic" label="I" italic />
                <div className="relative shrink-0" ref={moreRef}>
                  <Btn
                    onClick={() => setMoreOpen((v) => !v)}
                    active={moreOpen}
                    title="Alat lainnya"
                    icon="more_horiz"
                  />
                  {/* max-height + scroll: panel tetap di dalam viewport di layar
                      pendek (landscape/HP kecil) tanpa memotong aksi. */}
                  {moreOpen && (
                    <div
                      data-testid="editor-more-menu"
                      className="absolute right-0 top-full z-40 mt-1 max-h-[min(70dvh,26rem)] w-[min(92vw,22rem)] overflow-y-auto overscroll-contain rounded-2xl border border-outline-variant bg-white p-2 shadow-xl"
                    >
                      <div className="mb-1 flex items-center justify-between pl-1">
                        <span className="text-xs font-bold text-on-surface">Alat lainnya</span>
                        <button
                          type="button"
                          onClick={() => setMoreOpen(false)}
                          aria-label="Tutup alat lainnya"
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high"
                        >
                          <Icon name="close" className="text-[18px] leading-none" />
                        </button>
                      </div>
                      <div className="flex max-w-full flex-wrap items-center gap-1.5">
                        {formatGroups}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop (≥640px): toolbar expanded seperti sebelumnya, satu baris
              yang boleh wrap. Di mobile blok ini tidak dirender — dan saat menu
              "More" terbuka sengaja di-unmount agar tidak ada dua salinan live. */}
          {tab === "edit" && !moreOpen && (
            <div className="hidden max-w-full flex-wrap items-center gap-1.5 px-3 pb-2 sm:flex">
              {formatGroups}
            </div>
          )}
        </div>

        {/* Body */}
        {tab === "edit" ? (
          <div onClick={() => editor.commands.focus()}>
            <EditorContent editor={editor} />
          </div>
        ) : (
          <div className="min-h-[280px] bg-surface-container-lowest px-4 py-4 sm:px-6 sm:py-5">
            {editor.isEmpty ? (
              <p className="text-sm text-on-surface-variant">Belum ada konten untuk dipratinjau.</p>
            ) : (
              <div
                className="prose-kanum"
                // HTML sudah lolos sanitizer allowlist; caption dibungkus figure.
                dangerouslySetInnerHTML={{ __html: decorateCaptions(sanitizeHtml(editor.getHTML())) }}
              />
            )}
          </div>
        )}

        {tab === "edit" && (
          <div className="border-t border-outline-variant bg-surface-container-low px-4 py-2 text-[11px] text-on-surface-variant">
            Pilih gambar untuk crop, resize, posisi, caption, atau hapus.
          </div>
        )}

        {/* Dialog crop */}
        {cropSrc && (
          <ImageCropDialog
            src={cropSrc.src}
            alt={cropSrc.alt}
            onCancel={() => setCropSrc(null)}
            onApply={(file) => applyCrop(file)}
          />
        )}
      </div>
    );
  },
);

export default MateriContentEditor;

/* ════════════════ Dialog crop (canvas — crop nyata, bukan CSS) ════════════════ */

const CROP_RATIOS: Array<{ label: string; value: number | null }> = [
  { label: "Bebas", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "16:9", value: 16 / 9 },
  { label: "3:4", value: 3 / 4 },
  { label: "9:16", value: 9 / 16 },
];

type CropMode = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

function ImageCropDialog({
  src,
  alt,
  onCancel,
  onApply,
}: {
  src: string;
  alt: string;
  onCancel: () => void;
  onApply: (file: File) => Promise<boolean> | boolean | void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // Rect crop dalam koordinat gambar NATURAL; dirender sebagai % dari ukuran
  // tampil sehingga posisi/handle selalu presisi di viewport apa pun.
  const rect = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const natural = useRef({ w: 0, h: 0 });
  const drag = useRef<{ mode: CropMode; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number }>({
    mode: "move", sx: 0, sy: 0, ox: 0, oy: 0, ow: 0, oh: 0,
  });
  const [nonce, setNonce] = useState(0);
  const MIN = 24; // ukuran minimum crop (px natural)

  useEffect(() => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      imgRef.current = im;
      natural.current = { w: im.naturalWidth, h: im.naturalHeight };
      // Crop awal 80% tengah — ROOT CAUSE lama: rect awal = gambar penuh,
      // sehingga ruang gerak move = 0 dan drag terasa mati.
      rect.current = {
        x: im.naturalWidth * 0.1,
        y: im.naturalHeight * 0.1,
        w: im.naturalWidth * 0.8,
        h: im.naturalHeight * 0.8,
      };
      setErr("");
      setNonce((n) => n + 1);
    };
    im.onerror = () => setErr("Gambar tidak dapat dimuat untuk crop.");
    im.src = src;
  }, [src]);

  // Canvas hanya menggambar GAMBAR. Rect crop, dim, dan handle digambar
  // oleh DOM overlay (jelas terlihat + hit area akurat untuk pointer).
  useEffect(() => {
    const im = imgRef.current;
    const cv = canvasRef.current;
    if (!im || !cv) return;
    const scale = Math.min(1, 560 / im.naturalWidth);
    cv.width = Math.max(1, Math.round(im.naturalWidth * scale));
    cv.height = Math.max(1, Math.round(im.naturalHeight * scale));
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(im, 0, 0, cv.width, cv.height);
  }, [nonce, ratio]);

  function clampRect(r: { x: number; y: number; w: number; h: number }) {
    const n = natural.current;
    const w = Math.min(n.w, Math.max(MIN, r.w));
    const h = Math.min(n.h, Math.max(MIN, r.h));
    return {
      x: Math.min(Math.max(0, r.x), n.w - w),
      y: Math.min(Math.max(0, r.y), n.h - h),
      w,
      h,
    };
  }

  function applyRatio(rv: number | null) {
    setRatio(rv);
    const n = natural.current;
    if (!n.w) return;
    if (rv === null) {
      rect.current = clampRect({ x: n.w * 0.1, y: n.h * 0.1, w: n.w * 0.8, h: n.h * 0.8 });
    } else {
      // Fit rasio ke dalam 80% gambar, centered.
      let w = n.w * 0.8;
      let h = w / rv;
      if (h > n.h * 0.8) {
        h = n.h * 0.8;
        w = h * rv;
      }
      rect.current = clampRect({ x: (n.w - w) / 2, y: (n.h - h) / 2, w, h });
    }
    setNonce((v) => v + 1);
  }

  // Mapping pointer (px CSS tampil) → koordinat natural. Dihitung dari
  // getBoundingClientRect (bukan bitmap canvas) agar tidak ada offset saat
  // canvas di-stretch oleh CSS.
  function toNatural(clientX: number, clientY: number) {
    const cv = canvasRef.current;
    const n = natural.current;
    if (!cv || !n.w) return { x: 0, y: 0 };
    const b = cv.getBoundingClientRect();
    return {
      x: ((clientX - b.left) / Math.max(1, b.width)) * n.w,
      y: ((clientY - b.top) / Math.max(1, b.height)) * n.h,
    };
  }

  // Drag/resize: pointerdown di layer/handle, lalu move/up dipasang di WINDOW
  // (pola terbukti dari fix resize NodeView — tidak bergantung pointer capture
  // yang bisa gagal/lepas saat pointer keluar dari elemen kecil).
  function startDrag(e: React.PointerEvent<HTMLElement>, mode: CropMode) {
    const n = natural.current;
    if (!n.w) return;
    e.preventDefault();
    e.stopPropagation();
    const p = toNatural(e.clientX, e.clientY);
    drag.current = { mode, sx: p.x, sy: p.y, ox: rect.current.x, oy: rect.current.y, ow: rect.current.w, oh: rect.current.h };
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      const q = toNatural(ev.clientX, ev.clientY);
      const dx = q.x - d.sx;
      const dy = q.y - d.sy;
      if (d.mode === "move") {
        rect.current = clampRect({ x: d.ox + dx, y: d.oy + dy, w: d.ow, h: d.oh });
      } else {
        const m = d.mode;
        let x = d.ox, y = d.oy, w = d.ow, h = d.oh;
        if (m.includes("e")) w = d.ow + dx;
        if (m.includes("s")) h = d.oh + dy;
        if (m.includes("w")) { w = d.ow - dx; x = d.ox + dx; }
        if (m.includes("n")) { h = d.oh - dy; y = d.oy + dy; }
        if (ratio) {
          if (m.includes("e") || m.includes("w")) {
            h = w / ratio;
            if (m.includes("n")) y = d.oy + d.oh - h;
          } else {
            w = h * ratio;
            if (m.includes("w")) x = d.ox + d.ow - w;
          }
        }
        rect.current = clampRect({ x, y, w, h });
      }
      setNonce((v) => v + 1);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  const HANDLES: Array<[CropMode, string]> = [
    ["nw", "-top-1.5 -left-1.5 cursor-nwse-resize"],
    ["ne", "-top-1.5 -right-1.5 cursor-nesw-resize"],
    ["sw", "-bottom-1.5 -left-1.5 cursor-nesw-resize"],
    ["se", "-bottom-1.5 -right-1.5 cursor-nwse-resize"],
    ["n", "top-0 left-1/2 h-2 w-6 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize"],
    ["s", "bottom-0 left-1/2 h-2 w-6 -translate-x-1/2 translate-y-1/2 cursor-ns-resize"],
    ["w", "left-0 top-1/2 h-6 w-2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
    ["e", "right-0 top-1/2 h-6 w-2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize"],
  ];

  // Label aksesibel per handle (ikon-only → wajib punya nama).
  const HANDLE_LABEL: Record<CropMode, string> = {
    move: "Geser area crop",
    nw: "Ubah ukuran dari sudut kiri atas",
    ne: "Ubah ukuran dari sudut kanan atas",
    sw: "Ubah ukuran dari sudut kiri bawah",
    se: "Ubah ukuran dari sudut kanan bawah",
    n: "Ubah ukuran dari sisi atas",
    s: "Ubah ukuran dari sisi bawah",
    w: "Ubah ukuran dari sisi kiri",
    e: "Ubah ukuran dari sisi kanan",
  };

  async function doApply() {
    const im = imgRef.current;
    if (!im || busy) return;
    setBusy(true);
    setErr("");
    const r = rect.current;
    // Output pada resolusi natural area crop — kualitas maksimum sebelum
    // pipeline kompresi existing menangani ukuran file.
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(r.w));
    out.height = Math.max(1, Math.round(r.h));
    const ctx = out.getContext("2d");
    if (!ctx) {
      setBusy(false);
      setErr("Canvas tidak tersedia di browser ini.");
      return;
    }
    try {
      ctx.drawImage(im, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);
      const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/webp", 0.92));
      if (!blob) {
        setBusy(false);
        setErr("Gagal memproses gambar hasil crop.");
        return;
      }
      const ext = blob.type === "image/png" ? "png" : "webp";
      const ok = await onApply(new File([blob], `crop-${Date.now()}.${ext}`, { type: blob.type }));
      if (ok === false) {
        // Upload gagal: gambar lama tetap dipakai, modal tetap terbuka (retry/cancel).
        setBusy(false);
        setErr("Upload hasil crop gagal. Gambar lama tetap dipakai — coba lagi atau Batalkan.");
        return;
      }
      setBusy(false);      } catch {
      // Canvas tainted (URL eksternal tanpa CORS) → gambar asli utuh.
      setBusy(false);
      setErr("Gambar ini tidak dapat di-crop (dari sumber eksternal).");
    }
  }

  const n = natural.current;
  const pct = (v: number, total: number) => (total ? `${(v / total) * 100}%` : "0%");

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl">
        {/* Header — tetap */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant px-4 py-2.5 sm:px-5 sm:py-3">
          <h3 className="font-display text-base font-bold text-on-surface">Crop Gambar</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup"
            title="Tutup"
            className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high"
          >
            <Icon name="close" className="text-[20px] leading-none" />
          </button>
        </div>

        {/* Body — SATU area scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {CROP_RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                aria-pressed={ratio === r.value}
                className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${
                  ratio === r.value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-low"
                }`}
                onClick={() => applyRatio(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Preview. Rasio container = rasio gambar ASLI (bukan 4:3 tetap):
              tanpa letterbox, pemetaan pointer (getBoundingClientRect →
              koordinat natural) tepat, sehingga crop tidak meleset pada
              gambar bersumbu selain 4:3. */}
          <div className="mx-auto w-full max-w-2xl">
            <div
              className="relative w-full"
              style={n.w ? { aspectRatio: `${n.w} / ${n.h}` } : undefined}
            >
              {/* Lapisan gambar + peredup, dipotong ke sudut membulat */}
              <div className="absolute inset-0 overflow-hidden rounded-xl bg-black">
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                {/* Area di luar crop diredupkan agar batas crop terlihat jelas */}
                {n.w > 0 && (
                  <div
                    className="pointer-events-none absolute border-2 border-white/90"
                    style={{
                      left: pct(rect.current.x, n.w),
                      top: pct(rect.current.y, n.h),
                      width: pct(rect.current.w, n.w),
                      height: pct(rect.current.h, n.h),
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
                    }}
                  />
                )}
              </div>

              {/* Area geser (di bawah handle, di atas gambar) */}
              <div
                className="absolute inset-0 cursor-move touch-none"
                onPointerDown={(e) => startDrag(e, "move")}
                aria-hidden
              />

              {/* Handle resize — di luar wrapper ber-overflow-hidden agar tidak
                  terpotong; hit area diperluas oleh .crop-handle::after */}
              {HANDLES.map(([mode, cls]) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={HANDLE_LABEL[mode]}
                  title={HANDLE_LABEL[mode]}
                  className={`crop-handle absolute h-4 w-4 rounded-full border-2 border-primary bg-white shadow hover:bg-primary ${cls}`}
                  onPointerDown={(e) => startDrag(e, mode)}
                />
              ))}
            </div>
          </div>

          {err && <p className="mt-3 text-center text-sm text-error">{err}</p>}

          <p className="mt-3 text-center text-[11px] text-on-surface-variant">
            Geser bagian tengah untuk memindahkan, tarik titik/sisi untuk mengubah ukuran.
          </p>
        </div>

        {/* Footer — tetap, safe-area aware */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-outline-variant px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-5 sm:pt-3">
          <ActionButton onClick={onCancel} disabled={busy}>
            Batal
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={() => void doApply()}
            disabled={busy || !imgRef.current}
          >
            {busy && (
              <Icon name="progress_activity" className="text-[16px] leading-none animate-spin" />
            )}
            {busy ? "Memproses..." : "Terapkan Crop"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

/* ════════════════ Elemen kecil toolbar ════════════════ */

function extractSrcs(html: string): string[] {
  const out: string[] = [];
  const RE = /<img\b[^>]*?\bsrc\s*=\s*"([^"]*)"/gi;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(html))) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-outline-variant bg-white px-1 py-0.5">
      {children}
    </div>
  );
}

function Popover({
  children,
  wide,
  align = "left",
}: {
  children: React.ReactNode;
  wide?: boolean;
  align?: "left" | "right";
}) {
  // Auto-clamp: setelah render, geser popout agar tidak keluar viewport kiri/
  // kanan (anchor mengikuti tombol; layar sempit sering membuat right-0/
  // left-0 tetap keluar layar).
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clamp = () => {
      el.style.left = "";
      el.style.right = "";
      const r = el.getBoundingClientRect();
      if (r.left < 8) {
        el.style.left = "0";
        el.style.right = "auto";
        el.style.transform = "none";
      } else if (r.right > window.innerWidth - 8) {
        el.style.right = "0";
        el.style.left = "auto";
        el.style.transform = "none";
      }
    };
    clamp();
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, []);
  return (
    <div
      ref={ref}
      data-testid="editor-popover"
      className={`absolute top-full z-20 mt-2 max-w-[calc(100vw-3rem)] rounded-2xl border border-outline-variant bg-white p-3 shadow-lg ${
        align === "right" ? "right-0" : "left-0"
      } ${wide ? "w-80" : "w-60"}`}
    >
      {children}
    </div>
  );
}

function Swatches({
  colors,
  onPick,
  onClear,
}: {
  colors: string[];
  onPick: (c: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      {/* Swatch 32px: cukup untuk tap presisi di layar sentuh. */}
      <div className="grid grid-cols-5 gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            aria-label={`Warna ${c}`}
            onClick={() => onPick(c)}
            className="h-8 w-8 rounded-lg border border-outline-variant"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 min-h-9 w-full rounded-lg border border-outline-variant px-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
      >
        Hapus warna
      </button>
    </div>
  );
}

function PopoverRow({
  value,
  onChange,
  onOk,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onOk: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onOk();
          }
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-outline-variant px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <button
        type="button"
        onClick={onOk}
        className="min-h-9 shrink-0 rounded-lg bg-primary px-3.5 text-xs font-bold text-on-primary hover:bg-primary-container"
      >
        OK
      </button>
    </div>
  );
}

function Btn({
  onClick,
  active,
  disabled,
  title,
  label,
  icon,
  bold,
  italic,
  underline,
  strike,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  label?: string;
  icon?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // jaga seleksi teks di editor
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md px-1.5 text-sm transition-colors sm:h-8 sm:min-w-8 ${
        active
          ? "bg-primary text-on-primary"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {icon ? (
        <Icon name={icon} className="text-[18px] leading-none" />
      ) : (
        <span
          className={[
            bold ? "font-bold" : "",
            italic ? "italic" : "",
            underline ? "underline" : "",
            strike ? "line-through" : "",
          ].join(" ")}
        >
          {label}
        </span>
      )}
    </button>
  );
}

"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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
import { sanitizeHtml, decorateCaptions } from "@/lib/sanitize-html";
import { ContentImage } from "@/components/editor/contentImage";
import { imageNodeView } from "@/components/editor/imageNodeView";
import { ImageCropDialog } from "@/components/editor/ImageCropDialog";
import {
  Group,
  Popover,
  PopoverRow,
  Swatches,
  ToolbarButton,
} from "@/components/editor/ToolbarControls";

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
 * - getHtmlWithReplacements: HTML final — blob diganti URL storage
 *   (via map), blob yang tak ada di map dibuang dari konten.
 */
export type ContentEditorHandle = {
  getHtmlWithReplacements: (map: Map<string, string>) => string;
};

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
    const [cropSrc, setCropSrc] = useState<string | null>(null);
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
        const src = cropTargetRef.current.node?.attrs?.src as string | undefined;
        if (src) setCropSrc(src);
      };
      const bus = cropBusRef.current;
      bus?.addEventListener("kanum-crop", onCrop);
      return () => {
        bus?.removeEventListener("kanum-crop", onCrop);
      };
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
    }, [value, editor]);

    // API untuk parent (dipakai saat Save).
    useImperativeHandle(
      ref,
      () => ({
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
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)" icon="undo" />
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)" icon="redo" />
              </Group>
              <Group>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)" label="B" bold />
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)" label="I" italic />
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)" label="U" underline />
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strike" label="S" strike />
                <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript" label="x²" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript" label="x₂" />
                <ToolbarButton
                  onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                  title="Bersihkan format"
                  icon="format_clear"
                />
              </Group>
              <Group>
                {(["p", "h1", "h2", "h3", "h4"] as const).map((h) => (
                  <ToolbarButton
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
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Daftar poin" icon="format_list_bulleted" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Daftar bernomor" icon="format_list_numbered" />
              </Group>
              <Group>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Rata kiri" icon="format_align_left" />
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Rata tengah" icon="format_align_center" />
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Rata kanan" icon="format_align_right" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Kutipan" icon="format_quote" />
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Garis pemisah" icon="horizontal_rule" />
              </Group>
              <Group>
                <div className="relative">
                  <ToolbarButton
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
                  <ToolbarButton
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
                  <ToolbarButton
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
                  <ToolbarButton
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
                    className="text-[18px] leading-none sm:hidden"
                  />
                  <span className="hidden sm:inline">{t === "edit" ? "Edit" : "Preview"}</span>
                </button>
              ))}
            </div>

            {/* Aksi inti mobile — Undo, Redo, Bold, Italic, More. Tetap 1 baris
                (touch target 40px), semua aksi sekunder ada di dalam "More". */}
            {tab === "edit" && (
              <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:hidden">
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo" icon="undo" />
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo" icon="redo" />
                <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-outline-variant" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold" label="B" bold />
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic" label="I" italic />
                <div className="relative shrink-0" ref={moreRef}>
                  <ToolbarButton
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
            src={cropSrc}
            onCancel={() => setCropSrc(null)}
            onApply={(file) => applyCrop(file)}
          />
        )}
      </div>
    );
  },
);

export default MateriContentEditor;

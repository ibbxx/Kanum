import type { Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";

/**
 * NodeView gambar: UI terpilih, handle resize, dan menu kontekstual
 * (crop, reset, alt, caption, posisi, hapus).
 *
 * Ditulis dengan DOM API (bukan React) karena ProseMirror mengelola
 * lifecycle node-nya sendiri — style & kelasnya ada di `app/globals.css`
 * (`.imgwrap`, `.imgresize`, `.imgmenu`, `.imgcap`).
 */

type MenuAction =
  | { kind: "attr"; name: string; value: string | null }
  | { kind: "reset-size" }
  | { kind: "reset-crop" }
  | { kind: "delete" }
  | { kind: "crop" };

export function imageNodeView(options: {
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
          applyAction({ kind: "attr", name: "alt", value: inp.value || null });
          altOpen = false;
        }
        if (e.key === "Escape") altOpen = false;
      });
      menu.appendChild(inp);
      const ok = mk("✓", "Simpan alt", () => {
        applyAction({ kind: "attr", name: "alt", value: inp.value || null });
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
          applyAction({ kind: "attr", name: "caption", value: inp.value || null });
          captionOpen = false;
        }
        if (e.key === "Escape") captionOpen = false;
      });
      menu.appendChild(inp);
      const ok = mk("✓", "Simpan caption", () => {
        applyAction({ kind: "attr", name: "caption", value: inp.value || null });
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
        applyAction({
          kind: "attr",
          name:
            title === "Rata kiri" || title === "Rata tengah" || title === "Rata kanan"
              ? "textAlign"
              : "layout",
          value: val,
        });
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

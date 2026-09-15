#!/usr/bin/env node
/**
 * KANUM — Phase 4 controlled content migration (legacy → current Supabase).
 *
 * READ-ONLY unless --apply is passed. Idempotent: safe to run repeatedly.
 *
 *   node scripts/restore-legacy-content.mjs            → DRY RUN (no writes)
 *   node scripts/restore-legacy-content.mjs --apply    → execute migration
 *
 * What it does:
 *   1. Extracts the legacy `chapters` (8) and `topics` (6) data objects from
 *      `_legacy/Dashboard Siswa/*-detail-page.js` by slicing exact object
 *      boundaries and evaluating the literal (source files untouched).
 *   2. Validates every referenced image exists in Asset/Images/.
 *   3. Builds content_html from the structured legacy data (educational
 *      content preserved; legacy Tailwind shell attributes stripped).
 *   4. Maps every image reference to a deterministic Storage object path:
 *        materi-images/bab-<n>--<file>.webp
 *        budaya-images/<topic_key>--<file>.webp
 *      The same file used in several places of one record maps to one object
 *      (no duplicate uploads within a record).
 *   5. [--apply] Compresses each unique image to ≤300 KB WebP with sharp
 *      (same 300 KB target as lib/image/compressImage.ts), uploads to the
 *      current Supabase Storage buckets, then inserts-or-updates
 *      public.materi / public.budaya (GET-then-PATCH/INSERT → idempotent
 *      without any schema change). Test/exercise data is never touched.
 *
 * Environment: reads .env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 * No secrets are written to any file or log.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");
const IMAGE_MAX_BYTES = 300 * 1024; // same target as lib/image/compressImage.ts

/* ------------------------------------------------------------------ */
/* 0. Environment                                                      */
/* ------------------------------------------------------------------ */

function readEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) throw new Error(".env not found at project root");
  const env = readFileSync(envPath, "utf8");
  const get = (k) => {
    const m = env.match(new RegExp(`^${k}="?([^"\r\n]+)"?`, "m"));
    return m ? m[1].trim() : "";
  };
  const url = get("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
  const key = get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  }
  return { url, key };
}

/* ------------------------------------------------------------------ */
/* 1. Legacy data extraction (read-only)                               */
/* ------------------------------------------------------------------ */

function extractLegacyObject(relPath, varName) {
  const file = path.join(ROOT, relPath);
  if (!existsSync(file)) throw new Error(`Legacy source missing: ${relPath}`);
  const src = readFileSync(file, "utf8");

  const startMatch = src.match(new RegExp(`const ${varName} = \\{`));
  if (!startMatch) throw new Error(`Cannot find "const ${varName} = {" in ${relPath}`);
  const start = startMatch.index + startMatch[0].length;
  const end = src.indexOf("\n    };", start);
  if (end < 0) throw new Error(`Cannot find closing boundary of ${varName} in ${relPath}`);

  // The literal is self-contained (no outer identifiers) → evaluate safely.
  // Slice excludes the opening brace, so re-wrap in braces.
  const literal = src.slice(start, end);
  return new Function(`return ({${literal}});`)();
}

const MATERI_SRC = "_legacy/Dashboard Siswa/materi-detail-page.js";
const BUDAYA_SRC = "_legacy/Dashboard Siswa/budaya-detail-page.js";

const legacyChapters = extractLegacyObject(MATERI_SRC, "chapters");
const legacyTopics = extractLegacyObject(BUDAYA_SRC, "topics");

/* ------------------------------------------------------------------ */
/* 2. Image inventory + deterministic Storage mapping                  */
/* ------------------------------------------------------------------ */

const IMAGE_DIR = path.join(ROOT, "Asset", "Images");
const foundImages = new Map(); // filename → absolute path
if (existsSync(IMAGE_DIR)) {
  for (const f of readdirSync(IMAGE_DIR)) {
    const p = path.join(IMAGE_DIR, f);
    if (statSync(p).isFile() && f.toLowerCase().endsWith(".png")) {
      foundImages.set(f, p);
    }
  }
}

function readEnvOnce() {
  let cached = null;
  return () => (cached ??= readEnv());
}
const envOnce = readEnvOnce();

function storagePublicUrl(bucket, objectPath) {
  return `${envOnce().url}/storage/v1/object/public/${bucket}/${objectPath}`;
}

/**
 * Map a legacy image reference ("../Asset/Images/xxx.png") to a deterministic
 * current-Storage object. WebP is the final on-storage format (compression
 * pipeline target), so the object path always ends in .webp.
 *
 * Cross-record dedup: the FIRST record that references a given source file
 * defines its canonical {bucket, objectPath, publicUrl}; every later reference
 * (other sections/records) reuses the same Storage object — one file is
 * uploaded exactly once, and shared usage never creates duplicate objects.
 */
const canonicalByFile = new Map(); // fileName → canonical ref

function mapLegacySrcToStorage(src, recordKey, bucket) {
  const m = String(src || "").match(/Asset\/Images\/([^"'\s)>]+)/);
  if (!m) return null;
  const fileName = m[1];
  const localPath = foundImages.get(fileName);
  if (!localPath) return { fileName, missing: true, recordKey, bucket };
  const canonical = canonicalByFile.get(fileName);
  if (canonical) return canonical;
  const webpName = fileName.replace(/\.png$/i, "") + ".webp";
  const objectPath = `${recordKey}--${webpName}`;
  const ref = {
    fileName,
    missing: false,
    recordKey,
    bucket,
    objectPath,
    localPath,
    publicUrl: storagePublicUrl(bucket, objectPath),
  };
  canonicalByFile.set(fileName, ref);
  return ref;
}

/* ------------------------------------------------------------------ */
/* 3. Content HTML builders                                            */
/* ------------------------------------------------------------------ */

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragraphs(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

/** Rewrite legacy image paths inside an HTML fragment to Storage URLs. */
function rewriteImagesInHtml(fragment, recordKey, bucket, refsOut) {
  const html = String(fragment || "").replace(
    /(?:\.\.\/|\/)?Asset\/Images\/([^"'\s)>]+)/g,
    (full, fileName) => {
      const info = mapLegacySrcToStorage(`Asset/Images/${fileName}`, recordKey, bucket);
      if (!info) return full; // not an Asset/Images ref → leave untouched
      refsOut.push(info);
      if (info.missing) return full; // reported as unresolved; kept as-is
      return info.publicUrl;
    }
  );
  return html;
}

/**
 * Convert legacy content-box divs to <blockquote> (balanced, stack-based).
 * Box divs can nest (a box inside a box), so a per-opener regex swap is not
 * safe: each opener pushes depth, and the matching closer pops it — the box
 * closes exactly when depth returns to 0. Non-box divs inside a box are kept.
 */
function convertContentBoxes(html) {
  const BOX_OPENER = /^<div class="(?:formula-box|example-card|highlight-box|note-box)/;
  const tokens = [];
  const tokenRe = /<[^>]+>/g;
  let last = 0, m;
  while ((m = tokenRe.exec(html)) !== null) {
    if (m.index > last) tokens.push({ t: "text", v: html.slice(last, m.index) });
    tokens.push({ t: "tag", v: m[0] });
    last = m.index + m[0].length;
  }
  if (last < html.length) tokens.push({ t: "text", v: html.slice(last) });

  let out = "";
  let boxDepth = 0;
  for (const tok of tokens) {
    if (tok.t === "text") { out += tok.v; continue; }
    const tag = tok.v;
    if (boxDepth === 0) {
      if (BOX_OPENER.test(tag)) { out += "<blockquote>"; boxDepth = 1; }
      else out += tag;
    } else if (/^<div\b/i.test(tag)) {
      boxDepth += 1; out += tag;
    } else if (/^<\/div>/i.test(tag)) {
      boxDepth -= 1;
      out += boxDepth === 0 ? "</blockquote>" : tag;
    } else out += tag;
  }
  return out;
}

/** Strip legacy shell attributes from evaluated legacy section HTML. */
function cleanLegacyHtml(fragment, recordKey, bucket, refsOut) {
  let html = String(fragment || "");
  // Semantic upgrade before attribute stripping: content boxes → blockquote
  // (balanced stack conversion — box divs may nest, closer must match opener).
  html = convertContentBoxes(html);
  // Strip old-frontend styling (Tailwind utilities, inline styles).
  html = html.replace(/\sclass="[^"]*"/g, "").replace(/\sstyle="[^"]*"/g, "");
  // Drop Tailwind spacing/gradient overlay divs keep content: harmless <div>.
  return rewriteImagesInHtml(html, recordKey, bucket, refsOut);
}

function buildMateriContentHtml(ch, key, refsOut) {
  const parts = [];
  if (ch.intro) parts.push(`<p><em>${esc(ch.intro)}</em></p>`);
  if (Array.isArray(ch.tujuan) && ch.tujuan.length) {
    parts.push("<h2>Tujuan Pembelajaran</h2>\n<ul>");
    for (const t of ch.tujuan) parts.push(`  <li>${esc(t)}</li>`);
    parts.push("</ul>");
  }
  for (const s of ch.sections || []) {
    parts.push(`<h2>${esc(s.title)}</h2>`);
    parts.push(cleanLegacyHtml(s.content, `bab-${key}`, "materi-images", refsOut));
  }
  return parts.join("\n");
}

function buildBudayaContentHtml(t, key, refsOut) {
  const parts = [];
  if (t.description) parts.push(paragraphs(t.description));
  if (t.mathConnection) {
    parts.push("<h2>Koneksi Matematika</h2>");
    parts.push(paragraphs(t.mathConnection));
  }
  if (Array.isArray(t.gallery) && t.gallery.length) {
    parts.push("<h2>Galeri</h2>\n<ul>");
    for (const g of t.gallery) {
      if (g.isMap) {
        parts.push(
          `  <li><a href="${esc(g.mapUrl)}" rel="noopener" target="_blank">Lihat lokasi: ${esc(g.title || "Peta Desa Adat Ammatoa Kajang")}</a></li>`
        );
        continue;
      }
      const info = mapLegacySrcToStorage(g.src, key, "budaya-images");
      if (info) refsOut.push(info);
      const img = info && !info.missing
        ? `<img src="${info.publicUrl}" alt="${esc(g.title || "")}" loading="lazy" />`
        : "";
      const math = g.math ? ` <p><em>${esc(g.math)}</em></p>` : "";
      parts.push(
        `  <li>${img}<p><strong>${esc(g.caption || "")}</strong> — ${esc(g.desc || "")}</p>${math}</li>`
      );
    }
    parts.push("</ul>");
  }
  if (Array.isArray(t.relatedMaterial) && t.relatedMaterial.length) {
    parts.push("<h2>Materi Terkait</h2>\n<ul>");
    for (const r of t.relatedMaterial) {
      const concepts = Array.isArray(r.concepts) ? r.concepts.join(", ") : "";
      const benefit = r.benefit ? ` <p><em>Manfaat: ${esc(r.benefit)}</em></p>` : "";
      parts.push(
        `  <li><p><strong>${esc(r.name)}</strong> — ${esc(r.relation || "")}</p>` +
          (concepts ? `<p>Kata kunci: ${esc(concepts)}</p>` : "") + benefit + "</li>"
      );
    }
    parts.push("</ul>");
  }
  if (Array.isArray(t.funFacts) && t.funFacts.length) {
    parts.push("<h2>Fakta Menarik</h2>\n<ul>");
    for (const f of t.funFacts) {
      if (typeof f === "string") {
        parts.push(`  <li><p>${esc(f)}</p></li>`);
      } else {
        parts.push(
          `  <li><p><strong>${esc(f.title || "")}</strong> ${esc(f.body || "")}</p></li>`
        );
      }
    }
    parts.push("</ul>");
  }
  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/* 4. Plan rows                                                        */
/* ------------------------------------------------------------------ */

function planMateri(refsOut) {
  const rows = [];
  const keys = Object.keys(legacyChapters).sort((a, b) => Number(a) - Number(b));
  for (const key of keys) {
    const ch = legacyChapters[key];
    const rk = `bab-${key}`;
    const hero = mapLegacySrcToStorage(ch.hero, rk, "materi-images");
    if (hero) refsOut.push(hero);
    const content_html = buildMateriContentHtml(ch, key, refsOut);
    rows.push({
      logical_key: `chapter_number=${key}`,
      conflict_key: { chapter_number: Number(key) },
      insert: {
        chapter_number: Number(key),
        title: ch.title,
        level: (ch.level || "Dasar").toLowerCase(),
        description: ch.intro || "",
        duration_minutes: parseInt(ch.time, 10) || 30,
        image_url: hero && !hero.missing ? hero.publicUrl : null,
        content_html,
        is_published: true,
        sort_order: Number(key),
        created_by: null,
      },
    });
  }
  return rows;
}

function planBudaya(refsOut) {
  const rows = [];
  const keys = Object.keys(legacyTopics);
  keys.forEach((key, i) => {
    const t = legacyTopics[key];
    const hero = mapLegacySrcToStorage(t.heroImage, key, "budaya-images");
    if (hero) refsOut.push(hero);
    const content_html = buildBudayaContentHtml(t, key, refsOut);
    rows.push({
      logical_key: `topic_key=${key}`,
      conflict_key: { topic_key: key },
      insert: {
        topic_key: key,
        title: t.title,
        category: t.badge || "Umum",
        description: t.description || "",
        image_url: hero && !hero.missing ? hero.publicUrl : null,
        content_html,
        is_published: true,
        sort_order: i + 1,
        created_by: null,
      },
    });
  });
  return rows;
}

/* ------------------------------------------------------------------ */
/* 5. Compression                                                      */
/* ------------------------------------------------------------------ */

async function compressToWebp(inputPath) {
  const sharp = (await import("sharp")).default;
  let width;
  const meta = await sharp(inputPath).metadata();
  width = Math.min(meta.width || 2048, 2048);
  let quality = 82;
  let buf = await sharp(inputPath, { failOn: "none" })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
  while (buf.length > IMAGE_MAX_BYTES && quality > 40) {
    quality -= 12;
    buf = await sharp(inputPath, { failOn: "none" })
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  }
  while (buf.length > IMAGE_MAX_BYTES && width > 320) {
    width = Math.round(width * 0.8);
    buf = await sharp(inputPath, { failOn: "none" })
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 40 })
      .toBuffer();
  }
  return { buf, contentType: "image/webp" };
}

/* ------------------------------------------------------------------ */
/* 6. Supabase REST + Storage helpers                                  */
/* ------------------------------------------------------------------ */

function api(pathname, init = {}) {
  const { url, key } = envOnce();
  return fetch(`${url}${pathname}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function listAll(table, select) {
  const r = await api(`/rest/v1/${table}?select=${select}&limit=1000`);
  if (!r.ok) throw new Error(`GET ${table} failed: ${r.status} ${(await r.text()).slice(0, 150)}`);
  return r.json();
}

async function storageObjectExists(bucket, objectPath) {
  const { url, key } = envOnce();
  const r = await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "HEAD",
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return r.ok;
}

async function uploadToStorage(bucket, objectPath, buf, contentType) {
  const { url, key } = envOnce();
  const r = await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "true",
      "Cache-Control": "public,max-age=31536000,immutable",
    },
    body: buf,
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`storage upload failed ${bucket}/${objectPath}: ${r.status} ${t.slice(0, 150)}`);
  }
}

async function insertRow(table, row) {
  const r = await api(`/rest/v1/${table}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`INSERT ${table} failed: ${r.status} ${t.slice(0, 200)}`);
  }
  const arr = await r.json();
  return arr && arr[0];
}

async function patchRow(table, id, fields) {
  const r = await api(`/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(fields),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PATCH ${table}/${id} failed: ${r.status} ${t.slice(0, 200)}`);
  }
  const arr = await r.json();
  return arr && arr[0];
}

/* ------------------------------------------------------------------ */
/* 7. Main                                                             */
/* ------------------------------------------------------------------ */

async function main() {
  console.log(`KANUM legacy content migration — ${APPLY ? "APPLY" : "DRY RUN"} mode`);
  console.log("=".repeat(64));

  const refsOut = [];
  const materiPlan = planMateri(refsOut);
  const budayaPlan = planBudaya(refsOut);

  /* ---------- current DB state (read-only) ---------- */
  const currentMateri = await listAll("materi", "id,chapter_number");
  const currentBudaya = await listAll("budaya", "id,topic_key");
  const materiByKey = new Map(currentMateri.map((r) => [r.chapter_number, r.id]));
  const budayaByKey = new Map(currentBudaya.map((r) => [r.topic_key, r.id]));

  /* ---------- image plan ---------- */
  const validRefs = refsOut.filter((r) => !r.missing);
  const missingAssets = [...new Set(refsOut.filter((r) => r.missing).map((r) => r.fileName))];
  const uniqueUploads = new Map(); // `${bucket}/${objectPath}` → ref
  for (const ref of validRefs) {
    const k = `${ref.bucket}/${ref.objectPath}`;
    if (!uniqueUploads.has(k)) uniqueUploads.set(k, ref);
  }
  const alreadyInStorage = [];
  let storageChecked = 0;
  if (APPLY) {
    for (const [k, ref] of uniqueUploads) {
      if (await storageObjectExists(ref.bucket, ref.objectPath)) alreadyInStorage.push(k);
      storageChecked++;
    }
  }

  /* ---------- dry-run report ---------- */
  const materiInserts = materiPlan.filter((p) => !materiByKey.has(p.conflict_key.chapter_number)).length;
  const materiUpdates = materiPlan.length - materiInserts;
  const budayaInserts = budayaPlan.filter((p) => !budayaByKey.has(p.conflict_key.topic_key)).length;
  const budayaUpdates = budayaPlan.length - budayaInserts;

  console.log("");
  console.log("MATERI (expected 8):");
  console.log(`  mapped: ${materiPlan.length}/8`);
  console.log(`  inserts: ${materiInserts} | updates: ${materiUpdates}`);
  console.log(`  content_html non-empty: ${materiPlan.filter((p) => p.insert.content_html.length > 100).length}/8`);
  console.log(`  unresolved content: ${materiPlan.filter((p) => p.insert.content_html.length <= 100).length}`);
  console.log("");
  console.log("BUDAYA (expected 6):");
  console.log(`  mapped: ${budayaPlan.length}/6`);
  console.log(`  inserts: ${budayaInserts} | updates: ${budayaUpdates}`);
  console.log(`  content_html non-empty: ${budayaPlan.filter((p) => p.insert.content_html.length > 100).length}/6`);
  console.log(`  unresolved content: ${budayaPlan.filter((p) => p.insert.content_html.length <= 100).length}`);
  console.log("");
  console.log("IMAGES:");
  console.log(`  total references: ${refsOut.length}`);
  console.log(`  source files found: ${validRefs.length}`);
  console.log(`  source files missing: ${missingAssets.length ? missingAssets.join(", ") : "0"}`);
  console.log(`  already existing in Storage: ${APPLY ? alreadyInStorage.length : "0 (buckets currently empty)"}`);
  console.log(`  new uploads planned: ${uniqueUploads.size - (APPLY ? alreadyInStorage.length : 0)}`);
  console.log(`  duplicate uploads prevented (in-record + cross-ref dedup): ${validRefs.length - uniqueUploads.size}`);
  console.log("");
  console.log("HTML:");
  console.log(`  total image references: ${refsOut.length}`);
  console.log(`  successfully mapped: ${validRefs.length}`);
  console.log(`  unresolved references: ${refsOut.length - validRefs.length}`);
  console.log("");
  console.log("STRATEGY:");
  console.log("  created_by: NULL (column is nullable; legacy owner unknown; no UUID invented)");
  console.log("  is_published: TRUE (legacy UI served all chapters/topics to students)");
  console.log("  idempotency: GET-then-INSERT/PATCH keyed by chapter_number / topic_key");
  console.log("  untouched: exercises/questions/options/attempts/answers/progress/profiles");
  console.log("");

  /* ---------- per-row detail ---------- */
  console.log("Per-row plan:");
  for (const p of materiPlan) {
    const imgs = (p.insert.content_html.match(/<img /g) || []).length;
    const action = materiByKey.has(p.conflict_key.chapter_number) ? "UPDATE" : "INSERT";
    console.log(
      `  [materi] ${action} ${p.logical_key} "${p.insert.title}" level=${p.insert.level} ${p.insert.duration_minutes}m images(content)=${imgs} hero=${p.insert.image_url ? "yes" : "MISSING"}`
    );
  }
  for (const p of budayaPlan) {
    const imgs = (p.insert.content_html.match(/<img /g) || []).length;
    const action = budayaByKey.has(p.conflict_key.topic_key) ? "UPDATE" : "INSERT";
    console.log(
      `  [budaya] ${action} ${p.logical_key} "${p.insert.title}" cat=${p.insert.category} images(content)=${imgs} hero=${p.insert.image_url ? "yes" : "MISSING"}`
    );
  }
  console.log("");

  if (missingAssets.length) {
    console.log("VALIDATION FAILED: missing source images listed above. Aborting.");
    process.exit(1);
  }
  if (materiPlan.length !== 8 || budayaPlan.length !== 6) {
    console.log("VALIDATION FAILED: expected 8 materi / 6 budaya. Aborting.");
    process.exit(1);
  }

  if (!APPLY) {
    console.log("DRY RUN COMPLETE — no writes performed. Re-run with --apply to execute.");
    return;
  }

  /* ---------- apply: images ---------- */
  console.log("=== APPLY: uploading unique images ===");
  let uploaded = 0;
  let skipped = 0;
  for (const [k, ref] of uniqueUploads) {
    if (alreadyInStorage.includes(k)) {
      console.log(`  skipped (exists) ${k}`);
      skipped++;
      continue;
    }
    const { buf, contentType } = await compressToWebp(ref.localPath);
    await uploadToStorage(ref.bucket, ref.objectPath, buf, contentType);
    console.log(`  uploaded ${k} (${Math.round(buf.length / 1024)} KB)`);
    uploaded++;
  }

  /* ---------- apply: DB rows ---------- */
  console.log("");
  console.log("=== APPLY: inserting/updating rows ===");
  const touched = { materi: 0, budaya: 0 };
  for (const [plan, table, keyMap] of [
    [materiPlan, "materi", materiByKey],
    [budayaPlan, "budaya", budayaByKey],
  ]) {
    for (const p of plan) {
      const conflictValue =
        table === "materi" ? p.conflict_key.chapter_number : p.conflict_key.topic_key;
      const existingId = keyMap.get(conflictValue);
      if (existingId) {
        const { chapter_number, topic_key, created_by, ...fields } = p.insert;
        await patchRow(table, existingId, fields);
        console.log(`  updated ${table} ${p.logical_key} → id=${existingId.slice(0, 8)}…`);
      } else {
        const saved = await insertRow(table, p.insert);
        console.log(`  inserted ${table} ${p.logical_key} → id=${saved?.id?.slice(0, 8)}…`);
      }
      touched[table]++;
    }
  }

  /* ---------- apply: verification (actual DB content) ---------- */
  console.log("");
  console.log("=== VERIFY (actual DB rows) ===");
  const { url: verifyUrl } = envOnce();
  const m2 = await listAll(
    "materi",
    "id,chapter_number,title,is_published,image_url,content_html"
  );
  const b2 = await listAll(
    "budaya",
    "id,topic_key,title,is_published,image_url,content_html"
  );
  const mDupes = m2.length - new Set(m2.map((r) => r.chapter_number)).size;
  const bDupes = b2.length - new Set(b2.map((r) => r.topic_key)).size;
  const storagePrefix = `${verifyUrl}/storage/v1/object/public/`;

  function verifyRows(rows, label, keyField) {
    let brokenUrl = 0;
    let legacyPath = 0;
    let emptyContent = 0;
    let badImageRef = 0;
    for (const r of rows) {
      const html = String(r.content_html || "");
      if (html.length <= 100) emptyContent++;
      if (/Asset\/Images/.test(html)) legacyPath++;
      if (r.image_url && !r.image_url.startsWith(storagePrefix)) brokenUrl++;
      const srcs = [...html.matchAll(/<img [^>]*src="([^"]+)"/g)].map((m) => m[1]);
      for (const s of srcs) {
        if (!s.startsWith(storagePrefix)) badImageRef++;
      }
    }
    console.log(
      `  ${label}: ${rows.length} rows | dup ${keyField}: ${dupCount(rows, keyField)} | empty content: ${emptyContent} | legacy paths in content: ${legacyPath} | non-Storage image refs: ${badImageRef} | hero URL not Storage: ${brokenUrl}`
    );
  }
  function dupCount(rows, field) {
    return rows.length - new Set(rows.map((r) => r[field])).size;
  }

  verifyRows(m2, "materi", "chapter_number");
  verifyRows(b2, "budaya", "topic_key");
  console.log(`  uploaded images: ${uploaded} | skipped existing: ${skipped}`);

  /* ---------- unrelated data preserved? ---------- */
  const ex = await listAll("exercises", "id,title");
  console.log(`  exercises preserved: ${ex.length} row(s) (testing row untouched)`);

  const hardFail =
    m2.length !== 8 ||
    b2.length !== 6 ||
    mDupes !== 0 ||
    bDupes !== 0 ||
    b2.some((r) => /Asset\/Images/.test(String(r.content_html))) ||
    m2.some((r) => /Asset\/Images/.test(String(r.content_html)));
  if (hardFail) {
    console.log("VERIFY FAILED — see report above.");
    process.exit(1);
  }
  console.log("");
  console.log("MIGRATION COMPLETE.");
}

main().catch((e) => {
  console.error("MIGRATION FAILED:", e.message);
  process.exit(1);
});

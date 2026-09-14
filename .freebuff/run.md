# Run Doc — KANUM (dev server)

## 1. Reproduksi artefak (fresh checkout)

1. **Install dependencies** (npm, ada lockfile):
   ```bash
   npm install
   ```
2. **Copy `.env`** dari main checkout ke root project (berisi
   `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   Jangan pernah di-commit.
3. **Migrasi database** — jalankan berurutan di Supabase SQL Editor
   (lihat `Supabase/README.md`):
   `000_rebuild.sql` → `001_multi_role.sql` →
   `002_verification_flow.sql` → `003_performance_indexes.sql`.
4. Port **3000** harus bebas (`lsof -ti:3000` untuk cek).

## 2. Menjalankan server

```bash
npm run dev
```

- URL: **http://localhost:3000** (`next dev -p 3000`, sudah di-pin).
- Log rekomendasi saat detached:
  `.freebuff/preview-b882493d-ffe0-449d-b6a9-6c51e1e1df51.log`.
- Verifikasi hidup: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/`
  → `200`.

### Detach agar outlive sesi (macOS, runner ini)

`nohup ... &` dari runner terminal SERING ter-reap (proses hilang beberapa
detik kemudian) — gunakan launchd:

```bash
launchctl submit -l kanum-preview-882493d -- /bin/sh -c \
  "export HOME=/Users/ibnufajar USER=ibnufajar; \
   cd /Users/ibnufajar/Documents/project/KANUM && \
   exec env PATH=/usr/local/bin:/usr/bin:/bin node \
   node_modules/next/dist/bin/next dev -p 3000 \
   >> .freebuff/preview-b882493d-ffe0-449d-b6a9-6c51e1e1df51.log 2>&1"
```

⚠️ `export HOME` WAJIB — tanpa itu job launchd crash exit 1 berulang
(`launchctl print` → `runs = N, last exit code = 1`) karena Next.js butuh
`HOME` saat `next dev` start. Hentikan dengan:
`launchctl remove kanum-preview-882493d`.

Catatan: akun admin contoh tersedia melalui seeding manual di SQL Editor
(lihat percakapan; jangan simpan kredensial di repo).

E2E guard/RPC check siap pakai: `bash .freebuff/e2e.sh`
(boot server + uji guard anonim/admin + RPC security).

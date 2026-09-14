# KANUM – Kajang Numerasi

Platform etnomatematika Ammatoa Kajang. Stack: **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase**, deploy di **Vercel**.

## Setup

1. Node.js 18+
2. Salin env:

```bash
cp .env.example .env
```

Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari Supabase → Project Settings → API.

3. Di Supabase → **SQL Editor**, jalankan berurutan (idempotent, aman diulang):
   1. `Supabase/000_rebuild.sql` — schema dasar (tabel, trigger, RLS, RPC)
   2. `Supabase/001_multi_role.sql` — sistem tiga peran + kelas

4. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (dev) atau URL Vercel
   - Redirect URLs: `http://localhost:3000/auth/callback`, `/auth/confirm`, `/daftar`

Role: **siswa** → `/dashboard`. **Guru** → `/guru` (pengelolaan kelas & konten miliknya). **Admin** → `/admin` (semua + kelola akun). Tutorial lengkap setup (migrasi, URL, email, Resend): [`Supabase/docs/TUTORIAL.md`](Supabase/docs/TUTORIAL.md).

5. Install & jalankan:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Route

| URL | Halaman |
|-----|---------|
| `/` | Landing |
| `/login` `/daftar` | Auth |
| `/privacy` `/terms` | Legal |
| `/dashboard` | Siswa |
| `/materi` `/materi/[id]` | Materi |
| `/budaya` `/budaya/[id]` | Budaya |
| `/latihan` `/latihan/[id]` | Latihan & quiz |
| `/laporan` `/pengaturan` | Siswa |
| `/admin` … | Panel guru/admin |

Quiz memakai RPC Supabase `get_student_quiz` dan `submit_student_quiz` (lihat `Supabase/000_rebuild.sql`).

## Deploy Vercel

- Framework: Next.js
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Redirect OAuth Google: `{origin}/auth/callback`

Kode HTML lama ada di `_legacy/` sebagai referensi, tidak di-deploy.

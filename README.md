# KANUM – Kajang Numerasi

Platform etnomatematika Ammatoa Kajang. Stack: **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase**, deploy di **Vercel**.

## Setup

1. Node.js 18+
2. Salin env:

```bash
cp .env.example .env
```

Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari Supabase → Project Settings → API.

3. Install & jalankan:

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

Quiz memakai RPC Supabase `get_student_quiz` dan `submit_student_quiz` (lihat `Supabase/schema.sql`).

## Deploy Vercel

- Framework: Next.js
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Redirect OAuth Google: `{origin}/auth/callback`

Kode HTML lama ada di `_legacy/` sebagai referensi, tidak di-deploy.

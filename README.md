# KANUM – Kajang Numerasi
## Platform Etnomatematika Ammatoa Kajang

---

## Setup & Menjalankan Proyek

### Prasyarat

- Node.js 18+
- npm

### Instalasi

```bash
npm install
```

### Build CSS (wajib sebelum membuka di browser)

```bash
# Production (minified)
npm run build:css

# Development (watch mode)
npm run watch:css
```

File CSS akan dihasilkan di `dist/tailwind.min.css`.

### Menjalankan Lokal

Gunakan [Vercel CLI](https://vercel.com/docs/cli) agar clean URL dan rewrites berfungsi:

```bash
npm i -g vercel
vercel dev
```

Atau gunakan **Live Server** di VS Code dengan catatan bahwa clean URL tidak akan berfungsi secara lokal — navigasi antar halaman tetap bisa menggunakan path `.html` langsung saat development.

> ⚠️ Tanpa `vercel dev`, URL seperti `/dashboard` tidak bisa diakses langsung. Gunakan path file HTML: `/Dashboard%20Siswa/Dashboard.html`

---

## Clean URL (Routing)

Semua route dikonfigurasi di `vercel.json`. Setelah deploy ke Vercel, URL berikut tersedia:

| URL | Halaman |
|-----|---------|
| `/` | Landing page |
| `/login` | Halaman masuk |
| `/daftar` | Halaman registrasi |
| `/dashboard` | Dashboard siswa |
| `/materi` | Daftar materi |
| `/materi/:id` | Detail materi |
| `/budaya` | Eksplorasi budaya |
| `/budaya/:id` | Detail budaya |
| `/latihan` | Daftar latihan |
| `/latihan/quiz` | Pengerjaan soal |
| `/laporan` | Laporan siswa |
| `/pengaturan` | Pengaturan akun |
| `/admin` | Dashboard admin |
| `/admin/latihan` | Kelola latihan |
| `/admin/soal` | Kelola soal |
| `/admin/materi` | Kelola materi |
| `/admin/budaya` | Kelola budaya |
| `/admin/progres` | Progres siswa |

---

## Cara Membuat Project Supabase

1. Buka [https://supabase.com](https://supabase.com) dan buat akun jika belum ada.
2. Klik **New Project** → isi nama project (misal: `kanum`), pilih region terdekat (Singapore), set password database.
3. Tunggu hingga project selesai dibuat (±1–2 menit).
4. Masuk ke **Project Settings → API**:
   - Salin **Project URL** → ini adalah `SUPABASE_URL`
   - Salin **anon public** key → ini adalah `SUPABASE_ANON_KEY`

---

## Cara Menjalankan SQL

1. Di Supabase Dashboard, buka menu **SQL Editor**.
2. Klik **New Query**.
3. Salin seluruh isi file `Supabase/schema.sql`.
4. Tempel ke SQL Editor.
5. Klik **Run** (atau tekan `Ctrl+Enter`).
6. Pastikan semua perintah berjalan tanpa error.

---

## Cara Mengisi Environment Variable (Supabase URL & Key)

Buka file `supabase.js` di root folder KANUM dan ganti dua baris berikut:

```js
const SUPABASE_URL  = 'GANTI_DENGAN_SUPABASE_URL';
const SUPABASE_KEY  = 'GANTI_DENGAN_SUPABASE_ANON_KEY';
```

> ⚠️ **Jangan** commit nilai asli ke repositori publik.

---

## Cara Membuat Akun Admin

1. Buka Supabase Dashboard → **Authentication → Users**.
2. Klik **Invite User** atau **Add User**, isi email dan password admin.
3. Setelah user dibuat, buka **SQL Editor** dan jalankan:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'email-admin-anda@domain.com';
   ```
4. Login ke KANUM di `/login` menggunakan email & password admin.
5. Sistem akan otomatis mengarahkan ke halaman **Admin Dashboard** (`/admin`).

---

## Struktur Folder

```
KANUM/
├── vercel.json              ← Konfigurasi clean URL routing
├── guard.js                 ← Auth guard terpusat (public/student/admin)
├── supabase.js              ← Supabase client (shared)
├── input.css                ← Tailwind CSS directives
├── tailwind.config.js       ← Konfigurasi token warna KANUM
├── package.json             ← Scripts: build:css, watch:css
├── dist/
│   └── tailwind.min.css     ← Generated (jangan di-commit)
├── Landing/
│   └── index.html           ← Halaman beranda (public)
├── Login/
│   ├── Masuk.html           ← Halaman masuk
│   ├── masuk.js             ← Logic halaman masuk
│   ├── Daftar.html          ← Halaman registrasi
│   └── daftar.js            ← Logic halaman registrasi
├── Dashboard Siswa/
│   ├── dashboard.js         ← Shell sidebar/topbar (shared)
│   ├── Dashboard.html       ← /dashboard
│   ├── dashboard-page.js
│   ├── Materi.html          ← /materi
│   ├── materi-page.js
│   ├── materi-detail.html   ← /materi/:id
│   ├── materi-detail-page.js
│   ├── Budaya.html          ← /budaya
│   ├── budaya-page.js
│   ├── budaya-detail.html   ← /budaya/:id
│   ├── budaya-detail-page.js
│   ├── Latihan.html         ← /latihan
│   ├── latihan-page.js
│   ├── latihan-supabase.html ← /latihan/quiz
│   ├── latihan-quiz-page.js
│   ├── Laporan.html         ← /laporan
│   ├── laporan-page.js
│   ├── Pengaturan.html      ← /pengaturan
│   └── pengaturan-page.js
├── Admin/
│   ├── admin.css            ← Stylesheet admin
│   ├── index.html           ← /admin
│   ├── admin-dashboard-page.js
│   ├── latihan.html         ← /admin/latihan
│   ├── admin-latihan-page.js
│   ├── soal.html            ← /admin/soal
│   ├── admin-soal-page.js
│   ├── materi.html          ← /admin/materi
│   ├── admin-materi-page.js
│   ├── budaya.html          ← /admin/budaya
│   ├── admin-budaya-page.js
│   ├── progres.html         ← /admin/progres
│   └── admin-progres-page.js
├── Asset/
│   └── Images/              ← Aset gambar
└── Supabase/
    └── schema.sql           ← SQL lengkap untuk Supabase
```

---

## Alur Penggunaan

### Admin
1. Login di `/login` → diarahkan ke `/admin`
2. Buka **Manajemen Latihan** → Tambah latihan baru
3. Klik tombol **Soal** → tambah soal & pilihan jawaban
4. Kembali ke daftar latihan → klik **Publish**
5. Pantau **Progres Siswa** untuk melihat hasil pengerjaan

### Siswa
1. Login di `/login` → diarahkan ke `/dashboard`
2. Buka menu **Latihan** → tampil latihan dari guru
3. Kerjakan soal di `/latihan/quiz`
4. Setelah submit → nilai tersimpan otomatis ke Supabase
5. Lihat ringkasan di `/laporan`

---

## Teknologi

- HTML5 / CSS3 / JavaScript (vanilla, IIFE pattern)
- Tailwind CSS (build lokal via CLI)
- Supabase (Auth + PostgreSQL + RLS)
- Material Symbols (Google Fonts)
- Plus Jakarta Sans + Inter (Google Fonts)
- Vercel (hosting + clean URL routing)

---

## Deploy ke Vercel

1. Push ke GitHub repository.
2. Connect di [vercel.com](https://vercel.com) → **New Project** → pilih repo.
3. Framework Preset: **Other**.
4. Build Command: `npm run build:css`
5. Output Directory: `.` (root)
6. Klik **Deploy**.

`vercel.json` sudah dikonfigurasi — clean URL akan aktif otomatis setelah deploy.

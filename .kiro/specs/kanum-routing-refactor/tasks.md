# Implementation Plan: KANUM Routing Refactor

## Overview

Refactor arsitektur KANUM secara bertahap tanpa mengubah UI. Urutan implementasi mengikuti dependency: setup fondasi → shared modules → halaman Login → halaman Siswa → halaman Admin → dokumentasi.

## Tasks

---

- [ ] 1. Setup Fondasi — vercel.json, guard.js, dan Tailwind Build System
  - [ ] 1.1 Buat `vercel.json` di root proyek dengan seluruh 18 rewrite rules
    - Definisikan semua route clean URL ke file `.html` fisik sesuai desain
    - Pastikan route dengan path parameter (`:id`) ditempatkan setelah route eksak
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 1.2 Buat `guard.js` di root proyek
    - Implementasikan IIFE dengan state machine `PAGE_ROLE` (public/student/admin)
    - Sembunyikan `document.documentElement` sebelum cek sesi, tampilkan kembali setelah izin diberikan
    - Tambahkan `try/catch` dengan redirect ke `/login` sebagai fallback saat `getSession()` gagal
    - Simpan `etno_user_name` dan `etno_user_class` ke `localStorage` saat `PAGE_ROLE = 'student'`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [ ]* 1.3 Tulis property test untuk Guard — Property 1 (Halaman Publik Tidak Diblokir)
    - **Property 1: Guard Tidak Memblokir Halaman Publik**
    - Simulasikan `PAGE_ROLE = 'public'` dengan berbagai kondisi sesi (tidak ada, siswa aktif, admin aktif)
    - Verifikasi tidak ada `window.location.replace` yang dipanggil
    - **Validates: Requirements 2.3, 2.11**

  - [ ]* 1.4 Tulis property test untuk Guard — Property 2 (Penyimpanan Profil ke localStorage)
    - **Property 2: Guard Menyimpan Profil Siswa ke localStorage**
    - Simulasikan profil siswa dengan berbagai nilai string (`full_name`, `class_name`) termasuk string kosong dan karakter Unicode
    - Verifikasi nilai `localStorage` sama persis dengan nilai profil
    - **Validates: Requirements 2.9**

  - [ ] 1.5 Setup Tailwind CSS build system lokal
    - Buat file `input.css` di root proyek dengan tiga direktif `@tailwind`
    - Perbarui `package.json`: tambahkan script `build:css` dan `watch:css`, tambahkan `tailwindcss@3.4.17` ke `devDependencies`
    - Jalankan `npm install` lalu `npm run build:css` untuk menghasilkan `dist/tailwind.min.css`
    - Perbarui `.gitignore`: tambahkan entri `dist/` dan `node_modules/` jika belum ada
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.4, 6.5, 6.6_

- [ ] 2. Checkpoint Setup — Verifikasi fondasi
  - Pastikan `vercel.json` valid JSON, `guard.js` tidak ada error sintaks, dan `dist/tailwind.min.css` berhasil dihasilkan.
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

---

- [ ] 3. Update `dashboard.js` — Navigasi Clean URL
  - [ ] 3.1 Perbarui array `pages` di `dashboard.js` dengan clean URL absolut
    - Ganti semua nilai `href` di array `pages` ke clean URL: `/dashboard`, `/materi`, `/budaya`, `/latihan`, `/laporan`, `/pengaturan`
    - _Requirements: 3.2_

  - [ ] 3.2 Perbarui fungsi `handleLogout` di `dashboard.js`
    - Ganti `window.location.href = '../Login/Masuk.html'` dengan `window.location.href = '/login'`
    - _Requirements: 3.5_

  - [ ]* 3.3 Tulis property test untuk navigasi — Property 4 (Tidak Ada href Placeholder)
    - **Property 4: Tidak Ada href Placeholder di Navigasi**
    - Verifikasi semua nilai `href` di array `pages` tidak bernilai `'#'`
    - **Validates: Requirements 3.6**

---

- [ ] 4. Proses Halaman Login
  - [ ] 4.1 Ekstrak JS inline dari `Login/Masuk.html` ke `Login/masuk.js`
    - Buat file `Login/masuk.js` dengan pola IIFE
    - Pindahkan fungsi `doLogin` dan `doGoogleLogin` beserta event listener toggle password ke dalam IIFE
    - Perbarui redirect pasca-login: `profile?.role === 'admin' ? '/admin' : '/dashboard'`
    - Expose `doLogin` dan `doGoogleLogin` ke `window` untuk atribut `onclick` inline
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 4.2 Update `Login/Masuk.html`
    - Ganti tag CDN Tailwind dengan `<link rel="stylesheet" href="/dist/tailwind.min.css">`
    - Hapus tag `<script id="tailwind-config">` inline
    - Tambahkan `<script>window.PAGE_ROLE = 'public';</script>` sebelum `supabase.js`
    - Tambahkan `<script src="/guard.js"></script>` setelah `supabase.js`
    - Ganti blok `<script>` inline logika bisnis dengan `<script src="./masuk.js" defer></script>`
    - Perbarui link navigasi ke clean URL (contoh: link ke halaman daftar → `/daftar`)
    - _Requirements: 3.1, 3.4, 4.6, 4.7, 5.3_

  - [ ] 4.3 Ekstrak JS inline dari `Login/Daftar.html` ke `Login/daftar.js`
    - Buat file `Login/daftar.js` dengan pola IIFE
    - Pindahkan semua logika registrasi (termasuk validasi form dan pemanggilan Supabase auth)
    - Expose fungsi yang diperlukan ke `window`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 4.4 Update `Login/Daftar.html`
    - Ganti CDN Tailwind dengan `<link rel="stylesheet" href="/dist/tailwind.min.css">`
    - Tambahkan `PAGE_ROLE = 'public'` dan muat `guard.js`
    - Ganti blok `<script>` inline logika bisnis dengan `<script src="./daftar.js" defer></script>`
    - Perbarui semua link navigasi ke clean URL
    - _Requirements: 3.1, 4.6, 4.7, 5.3_

  - [ ]* 4.5 Tulis property test untuk login redirect — Property 3 (Redirect Berdasarkan Role)
    - **Property 3: Login Redirect Berdasarkan Role**
    - Simulasikan login berhasil dengan `role = 'student'` dan `role = 'admin'`
    - Verifikasi `student` → `/dashboard`, `admin` → `/admin`
    - **Validates: Requirements 3.4**

  - [ ]* 4.6 Tulis property test — Property 6 (File JS Halaman Menggunakan IIFE)
    - **Property 6: Setiap File JS Halaman Menggunakan IIFE**
    - Periksa bahwa `masuk.js` dan `daftar.js` dibungkus dalam IIFE
    - **Validates: Requirements 5.7**

- [ ] 5. Checkpoint Login — Verifikasi halaman Login
  - Pastikan semua tests pass. Buka `/login` dan `/daftar` di browser lokal, verifikasi tampilan tidak berubah secara visual dan navigasi antar keduanya berfungsi.

---

- [ ] 6. Proses Halaman Dashboard Siswa
  - [ ] 6.1 Ekstrak JS dan update `Dashboard Siswa/Dashboard.html` → `dashboard-page.js`
    - Buat `Dashboard Siswa/dashboard-page.js` dengan pola IIFE (logika yang tidak ada di `dashboard.js`)
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./dashboard-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 6.2 Ekstrak JS dan update `Dashboard Siswa/Materi.html` → `materi-page.js`
    - Buat `Dashboard Siswa/materi-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./materi-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 6.3 Ekstrak JS dan update `Dashboard Siswa/materi-detail.html` → `materi-detail-page.js`
    - Buat `Dashboard Siswa/materi-detail-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./materi-detail-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 6.4 Ekstrak JS dan update `Dashboard Siswa/Budaya.html` → `budaya-page.js`
    - Buat `Dashboard Siswa/budaya-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./budaya-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 6.5 Ekstrak JS dan update `Dashboard Siswa/budaya-detail.html` → `budaya-detail-page.js`
    - Buat `Dashboard Siswa/budaya-detail-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./budaya-detail-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 6.6 Ekstrak JS dan update `Dashboard Siswa/Latihan.html` → `latihan-page.js`
    - Buat `Dashboard Siswa/latihan-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./latihan-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 6.7 Ekstrak JS dan update `Dashboard Siswa/latihan-supabase.html` → `latihan-quiz-page.js`
    - Buat `Dashboard Siswa/latihan-quiz-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./latihan-quiz-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 6.8 Ekstrak JS dan update `Dashboard Siswa/Laporan.html` → `laporan-page.js`
    - Buat `Dashboard Siswa/laporan-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./laporan-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 6.9 Ekstrak JS dan update `Dashboard Siswa/Pengaturan.html` → `pengaturan-page.js`
    - Buat `Dashboard Siswa/pengaturan-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'student'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./pengaturan-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ]* 6.10 Tulis property test — Property 5 (Tidak Ada CDN Tailwind di HTML)
    - **Property 5: Tidak Ada CDN Tailwind di Halaman HTML**
    - Periksa semua file `.html` di folder `Dashboard Siswa/` tidak mengandung `cdn.tailwindcss.com`
    - **Validates: Requirements 4.6**

  - [ ]* 6.11 Tulis property test — Property 7 (Tidak Ada JS Inline Logika Bisnis di HTML)
    - **Property 7: Tidak Ada JS Inline Logika Bisnis di HTML**
    - Periksa semua file `.html` di folder `Dashboard Siswa/` tidak mengandung definisi fungsi bisnis di tag `<script>` inline
    - **Validates: Requirements 5.1, 5.3**

- [ ] 7. Checkpoint Dashboard Siswa — Verifikasi 8 halaman siswa
  - Pastikan semua tests pass. Verifikasi navigasi sidebar antar halaman siswa berfungsi dengan clean URL, guard redirect ke `/login` saat tidak ada sesi.

---

- [ ] 8. Proses Halaman Admin
  - [ ] 8.1 Ekstrak JS dan update `Admin/index.html` → `admin-dashboard-page.js`
    - Buat `Admin/admin-dashboard-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'admin'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./admin-dashboard-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 8.2 Ekstrak JS dan update `Admin/latihan.html` → `admin-latihan-page.js`
    - Buat `Admin/admin-latihan-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'admin'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./admin-latihan-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 8.3 Ekstrak JS dan update `Admin/soal.html` → `admin-soal-page.js`
    - Buat `Admin/admin-soal-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'admin'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./admin-soal-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 8.4 Ekstrak JS dan update `Admin/materi.html` → `admin-materi-page.js`
    - Buat `Admin/admin-materi-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'admin'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./admin-materi-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 8.5 Ekstrak JS dan update `Admin/budaya.html` → `admin-budaya-page.js`
    - Buat `Admin/admin-budaya-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'admin'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./admin-budaya-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ] 8.6 Ekstrak JS dan update `Admin/progres.html` → `admin-progres-page.js`
    - Buat `Admin/admin-progres-page.js` dengan pola IIFE
    - Ganti CDN Tailwind dengan file lokal, tambahkan `PAGE_ROLE = 'admin'` dan muat `guard.js`
    - Ganti blok inline dengan `<script src="./admin-progres-page.js" defer></script>`
    - _Requirements: 3.1, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4, 5.7_

  - [ ]* 8.7 Tulis property test — Property 5 lanjutan (Tidak Ada CDN Tailwind di folder Admin)
    - **Property 5: Tidak Ada CDN Tailwind di Halaman HTML (Admin)**
    - Periksa semua file `.html` di folder `Admin/` tidak mengandung `cdn.tailwindcss.com`
    - **Validates: Requirements 4.6**

  - [ ]* 8.8 Tulis property test — Property 7 lanjutan (Tidak Ada JS Inline di folder Admin)
    - **Property 7: Tidak Ada JS Inline Logika Bisnis di HTML (Admin)**
    - Periksa semua file `.html` di folder `Admin/` tidak mengandung definisi fungsi bisnis di tag `<script>` inline
    - **Validates: Requirements 5.1, 5.3**

- [ ] 9. Checkpoint Admin — Verifikasi 6 halaman admin
  - Pastikan semua tests pass. Verifikasi guard redirect siswa yang mencoba akses `/admin` ke `/dashboard`, dan akses tanpa sesi ke `/login`.

---

- [ ] 10. Update Landing Page dan README
  - [ ] 10.1 Update `Landing/index.html`
    - Ganti CDN Tailwind dengan `<link rel="stylesheet" href="/dist/tailwind.min.css">`
    - Tambahkan `PAGE_ROLE = 'public'` dan muat `guard.js`
    - Perbarui semua link navigasi ke clean URL (`/login`, `/daftar`)
    - _Requirements: 3.1, 4.6, 4.7, 6.3_

  - [ ] 10.2 Perbarui `README.md`
    - Tambahkan bagian setup: instalasi dependensi (`npm install`), build CSS (`npm run build:css`), dan cara menjalankan lokal dengan `vercel dev`
    - Dokumentasikan clean URL yang tersedia dan struktur folder baru
    - _Requirements: 6.8_

- [ ] 11. Final Checkpoint — Verifikasi End-to-End
  - Pastikan semua tests pass.
  - Verifikasi `dist/tailwind.min.css` dan `node_modules/` masuk `.gitignore`.
  - Verifikasi tidak ada `href="#"` placeholder navigasi yang tersisa di seluruh halaman.
  - Tanyakan ke user jika ada pertanyaan sebelum merge.

---

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task referensi ke requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap fase besar
- Property tests memvalidasi kebenaran universal (guard behavior, IIFE pattern, no CDN, no inline JS)
- File `dist/tailwind.min.css` adalah hasil build, tidak perlu di-commit — pastikan ada di `.gitignore`
- Selama proses migrasi bertahap, gunakan `vercel dev` untuk menguji clean URL secara lokal

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.5"] },
    { "id": 1, "tasks": ["1.3", "1.4", "3.1", "3.2"] },
    { "id": 2, "tasks": ["3.3", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 3, "tasks": ["4.5", "4.6", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9"] },
    { "id": 4, "tasks": ["6.10", "6.11", "8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 5, "tasks": ["8.7", "8.8", "10.1", "10.2"] }
  ]
}
```

# Implementation Plan: KANUM Optimization

## Overview

Rencana implementasi ini mencakup 15 perbaikan menyeluruh pada aplikasi web KANUM (Kajang Numerasi). Pekerjaan dikelompokkan dalam 9 epik berurutan — mulai dari fondasi database, perbaikan auth, data real dari Supabase, konten dinamis, navigasi konsisten, optimasi performa, mobile-first UI review, hingga pembersihan file. Semua UI menggunakan pendekatan **mobile-first** dengan Tailwind responsive prefixes (`sm:`, `md:`, `lg:`).

Stack: Vanilla HTML/CSS/JS · Tailwind CSS (CDN) · Supabase JS v2 · PostgreSQL RLS + RPC

---

## Tasks

- [x] 1. Database & Schema Foundations
  - [x] 1.1 Tambahkan tabel `public.materi` dan `public.budaya` ke `Supabase/schema.sql`
    - Definisikan kolom sesuai design document (id, title, chapter_number/topic_key, level/category, description, duration_minutes/image_url, content_html, is_published, sort_order, created_by, timestamps)
    - Tambahkan trigger `updated_at` untuk kedua tabel
    - Aktifkan RLS dan buat 2 policy per tabel: siswa hanya baca `is_published = true`, admin dapat semua operasi menggunakan fungsi `public.is_admin()`
    - _Requirements: 5.1, 5.2, 5.7_

  - [x] 1.2 Tambahkan fungsi RPC `get_student_quiz` ke `Supabase/schema.sql`
    - Implementasikan `CREATE OR REPLACE FUNCTION public.get_student_quiz(p_exercise_id UUID)` sebagai `SECURITY DEFINER`
    - Validasi latihan: `is_published = true OR public.is_admin()`, raise `P0002` jika tidak valid
    - Buat record baru di `exercise_attempts` dengan status `in_progress`, kembalikan `attempt_id`
    - Ambil soal dan opsi jawaban **tanpa kolom `is_correct`** menggunakan `jsonb_agg`
    - Return JSONB: `{ exercise, attempt_id, questions }`
    - _Requirements: 1.1, 1.3, 1.5, 1.6_

  - [x] 1.3 Tambahkan fungsi RPC `submit_student_quiz` ke `Supabase/schema.sql`
    - Implementasikan `CREATE OR REPLACE FUNCTION public.submit_student_quiz(p_attempt_id UUID, p_answers JSONB)` sebagai `SECURITY DEFINER`
    - Validasi kepemilikan attempt: jika `student_id != auth.uid()` raise error `42501`
    - Iterasi jawaban, hitung `earned_points`, `correct_count`, `wrong_count`, `score`
    - INSERT ke `student_answers` dan UPDATE `exercise_attempts` dengan status `completed`
    - Return JSONB: `{ score, correct_count, wrong_count, review }` termasuk kunci jawaban
    - _Requirements: 1.2, 1.4, 1.6_

  - [x] 1.4 Perbarui trigger `handle_new_user` di `Supabase/schema.sql`
    - Ubah fungsi agar memetakan `raw_user_meta_data->>'role' = 'teacher'` → `role = 'admin'` di tabel `profiles`
    - Semua nilai selain `'teacher'` disimpan sebagai `'student'`
    - Pastikan fungsi menggunakan `COALESCE` agar tidak error jika metadata kosong
    - _Requirements: 4.2_

- [x] 2. Auth Fixes
  - [x] 2.1 Perbaiki fungsi `doRegister()` di `Login/Daftar.html` untuk role mapping
    - Baca nilai radio button `role` dan petakan: `'guru'` → kirim `role: 'teacher'` pada `options.data` ke Supabase Auth
    - Tampilkan pesan toast yang berbeda untuk role guru (instruksi cek email + redirect ke Admin Panel setelah verifikasi)
    - Gabungkan 3 tag `<link>` Google Fonts yang duplikat menjadi 1 URL tunggal yang memuat `Plus+Jakarta+Sans`, `Inter`, dan `Material+Symbols+Outlined`
    - Tambahkan `preconnect` dan `dns-prefetch` hints untuk `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net` di `<head>`
    - Pin versi Supabase JS: ganti `@supabase/supabase-js@2` menjadi `@2.49.1`
    - _Requirements: 4.1, 4.4, 15.2, 15.4, 15.5_

  - [x] 2.2 Ganti link Terms & Privacy di `Login/Daftar.html` dan buat halaman baru
    - Ganti `href="../Docs/04-DEVELOPMENT-RULES.md"` dengan `href="../Landing/terms.html" target="_blank"`
    - Ganti `href="../Docs/DESIGN.md"` dengan `href="../Landing/privacy.html" target="_blank"`
    - Buat file `Landing/terms.html` — halaman Syarat & Ketentuan dengan layout konsisten (`Landing/index.html`), mobile-first, memuat font dan warna token yang sama
    - Buat file `Landing/privacy.html` — halaman Kebijakan Privasi dengan struktur yang sama
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 2.3 Implementasikan logout aman di semua halaman Student Dashboard
    - Pada `Dashboard Siswa/Laporan.html`, `Dashboard Siswa/Materi.html`, `Dashboard Siswa/Budaya.html`: ganti `<a href="../Login/Masuk.html">` logout dengan `<button type="button" class="app-nav-link is-logout" onclick="handleLogout(event)">` dan implementasikan fungsi `handleLogout` yang memanggil `_sb.auth.signOut()`, tampilkan toast jika error, tetap redirect
    - Lakukan hal yang sama untuk `Dashboard Siswa/Pengaturan.html`
    - Verifikasi bahwa `Admin/index.html` sudah menggunakan `_sb.auth.signOut()` (sudah ada di kode, cukup verifikasi)
    - Tambahkan logout aman ke `Admin/latihan.html`, `Admin/soal.html`, `Admin/progres.html` — ganti anchor dengan button + `signOut()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Checkpoint — Pastikan semua tes lulus, tanyakan ke user jika ada pertanyaan.

- [x] 4. Dashboard Siswa — Data Real dari Supabase
  - [x] 4.1 Refactor JavaScript di `Dashboard Siswa/Dashboard.html` untuk data dari Supabase
    - Hapus seluruh blok `localStorage` yang membaca `etno_completed_chapters` dan `etno_quiz_score_*`
    - Tambahkan `async DOMContentLoaded` handler: panggil `getSession()` → redirect jika tidak ada sesi
    - Ambil profil dari `public.profiles` dengan `session.user.id`, simpan ke `localStorage` dengan key `etno_user_name` dan `etno_user_class`
    - Update elemen greeting `h1.font-headline-md` dengan `full_name` dari profil
    - Ambil data dari `public.student_progress` untuk user yang login, hitung `completed`, `attempted`, `avgScore`
    - Tambahkan elemen `id="stat-completed"`, `id="stat-attempted"`, `id="stat-avg-score"` pada kartu statistik di HTML, update nilainya
    - Implementasikan `renderDashboardStats(null)` sebagai fallback yang menampilkan `"–"` dan toast error
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.3, 10.4_

  - [x] 4.2 Perbaiki path gambar rusak dan tambahkan lazy loading di `Dashboard Siswa/Dashboard.html`
    - Ganti `../Asset/Images/sejarahammatoa.png` → `../Asset/Images/ammatoa_pemimpin_tertinggi.png`
    - Ganti `../Asset/Images/prosesmenenun.png` → `../Asset/Images/Penenunan.png`
    - Ganti `../Asset/Images/polamatematika.png` → `../Asset/Images/Polabanyak.png`
    - Tambahkan `loading="lazy"` pada semua `<img>` di bagian kartu budaya dan kartu konten bawah viewport
    - Tambahkan `onerror` handler yang menampilkan `<div class="fallback-placeholder">` sebagai pengganti gambar rusak
    - Tambahkan CSS `.fallback-placeholder { background: var(--etno-surface-high, #dfe9fa); border-radius: inherit; width: 100%; min-height: 120px; }` ke `dashboard.css`
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 4.3 Refactor `Dashboard Siswa/Laporan.html` untuk data dari Supabase
    - Hapus seluruh blok localStorage di script, tambahkan `requireAuth` di atas
    - Tambahkan `id` unik pada elemen kartu statistik (progress materi, rata-rata skor, latihan selesai)
    - Ambil `student_progress` di-join dengan `exercises(title)` untuk ringkasan, tampilkan di kartu statistik
    - Ambil `exercise_attempts` dengan `order('started_at', { ascending: false }).limit(20)`, render sebagai daftar aktivitas
    - Jika kosong, tampilkan pesan: `"Belum ada aktivitas latihan. Silakan kunjungi menu Latihan!"`
    - Jika query gagal, tampilkan `"–"` di semua kartu + toast error
    - Implementasikan logout aman (sesuai task 2.3)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.4 Refactor `Dashboard Siswa/Pengaturan.html` untuk profil dari Supabase
    - Tambahkan `requireAuth` dan load profil: isi `input-name`, `input-class`, `input-email` dari `public.profiles`
    - Tambahkan `id="input-name"`, `id="input-class"`, `id="input-email"` pada field input di HTML
    - Implementasikan fungsi `saveProfile()` yang memanggil `_sb.from('profiles').update(...)` dan menampilkan toast sukses/gagal
    - Setelah sukses: perbarui `localStorage` (`etno_user_name`, `etno_user_class`) dan update elemen `.app-profile-name` in-place tanpa reload
    - Hubungkan tombol "Simpan" ke `saveProfile()` dan tombol "Batal" ke `history.back()`
    - Implementasikan logout aman (sesuai task 2.3)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 5. Checkpoint — Pastikan semua tes lulus, tanyakan ke user jika ada pertanyaan.

- [x] 6. Konten Dinamis Materi & Budaya + Admin CRUD Pages
  - [x] 6.1 Refactor `Dashboard Siswa/Materi.html` untuk konten dinamis dari Supabase
    - Hapus semua markup `<article class="bab-card">` yang hardcoded dari HTML (tetapi pertahankan struktur hero section, filter bar, dan elemen `<div id="materi-grid">`)
    - Tambahkan elemen `<div id="materi-grid">` sebagai container utama untuk kartu bab
    - Tambahkan script: `requireAuth` → ambil dari `public.materi` dengan `is_published = true` order `sort_order` → render kartu menggunakan template yang konsisten dengan desain existing (class `.bab-card`, `.h-44`, dsb.)
    - Fallback gambar: gunakan `../Asset/Images/gambarmateri.png` jika `image_url` null
    - Tambahkan `loading="lazy"` pada semua `<img>` kartu materi
    - _Requirements: 5.3, 11.1_

  - [x] 6.2 Refactor `Dashboard Siswa/Budaya.html` untuk konten dinamis dari Supabase
    - Hapus semua markup kartu budaya yang hardcoded dari Grid section, pertahankan hero section dan struktur container
    - Tambahkan elemen `<div id="budaya-grid">` sebagai container kartu
    - Tambahkan script: `requireAuth` → ambil dari `public.budaya` dengan `is_published = true` order `sort_order` → render kartu dengan template konsisten (class card existing, tombol navigasi ke `budaya-detail.html?topic=${b.topic_key}`)
    - Fallback gambar jika `image_url` null
    - Tambahkan `loading="lazy"` pada semua `<img>` kartu budaya
    - _Requirements: 5.4, 11.1_

  - [x] 6.3 Buat halaman Admin `Admin/materi.html` untuk CRUD tabel `public.materi`
    - Salin struktur dari `Admin/latihan.html` (sidebar dengan link nav baru, topbar, `requireAdmin`, logout aman)
    - Tambahkan link navigasi `Admin/materi.html` dan `Admin/budaya.html` ke sidebar di `Admin/materi.html`
    - Buat tabel data dengan kolom: Judul, Bab, Level, Status, Aksi (Edit, Delete, Toggle publish)
    - Implementasikan modal form Create/Edit dengan field: title, chapter_number, level (select), description, duration_minutes, image_url, content_html (textarea), is_published, sort_order
    - Implementasikan fungsi `loadMateri()`, `saveMateri()`, `deleteMateri()`, `togglePublishMateri()`
    - _Requirements: 5.5, 5.6_

  - [x] 6.4 Buat halaman Admin `Admin/budaya.html` untuk CRUD tabel `public.budaya`
    - Salin struktur dari `Admin/latihan.html` dengan sidebar yang memuat link ke semua halaman admin termasuk materi dan budaya
    - Buat tabel data dengan kolom: Judul, Topic Key, Category, Status, Aksi
    - Implementasikan modal form Create/Edit dengan field: title, topic_key, category, description, image_url, content_html (textarea), is_published, sort_order
    - Implementasikan fungsi `loadBudaya()`, `saveBudaya()`, `deleteBudaya()`, `togglePublishBudaya()`
    - _Requirements: 5.5, 5.6_

  - [x] 6.5 Perbarui sidebar di semua halaman Admin Panel untuk menambahkan link Materi & Budaya
    - Di `Admin/index.html`, `Admin/latihan.html`, `Admin/soal.html`, `Admin/progres.html`: tambahkan dua link baru di `<nav class="admin-nav">`:
      - `<a class="admin-nav-link" href="/Admin/materi.html">` dengan icon `menu_book` dan label `Materi`
      - `<a class="admin-nav-link" href="/Admin/budaya.html">` dengan icon `museum` dan label `Budaya`
    - Setiap halaman hanya perlu menambahkan class `is-active` pada link yang sesuai
    - _Requirements: 5.6_

- [x] 7. Navigasi Konsisten dengan dashboard.js
  - [x] 7.1 Perbaiki fallback nama di `Dashboard Siswa/dashboard.js`
    - Ganti `localStorage.getItem("etno_user_name") || "Miftah"` menjadi `|| "Pengguna"`
    - _Requirements: 10.1_

  - [x] 7.2 Audit dan perbaiki semua halaman Student Dashboard agar memuat `dashboard.js` sebagai script terakhir
    - Verifikasi bahwa `<script src="dashboard.js"></script>` (atau path relatif setara) ada sebelum `</body>` di: `Dashboard.html`, `Materi.html`, `Budaya.html`, `Latihan.html`, `latihan-supabase.html`, `Laporan.html`, `Pengaturan.html`
    - Tambahkan tag tersebut ke halaman yang belum memilikinya: `materi-detail.html`, `budaya-detail.html`, `latihan-detail.html`
    - _Requirements: 8.1_

  - [x] 7.3 Hapus duplikasi elemen navigasi statis di halaman yang sudah menggunakan `dashboard.js`
    - Di `Dashboard Siswa/Dashboard.html`: hapus markup `<aside>` sidebar statis dan `<header>` topbar statis (biarkan `dashboard.js` menyuntikkannya)
    - Di `Dashboard Siswa/Laporan.html`, `Dashboard Siswa/Materi.html`, `Dashboard Siswa/Budaya.html`, `Dashboard Siswa/Pengaturan.html`: hapus `<aside>` sidebar statis
    - Di `Dashboard Siswa/Latihan.html`: hapus duplikasi `<script src="/supabase.js"></script>` yang ada di akhir body (pertahankan yang ada di `<head>`)
    - _Requirements: 8.2, 8.3, 9.1, 9.2_

  - [x] 7.4 Implementasikan filter kategori dinamis di `Dashboard Siswa/Latihan.html`
    - Hapus tombol filter statis ("Geometri", "Bilangan", "Aritmatika Sosial", "Aljabar") dari HTML `#category-filter-bar`, biarkan hanya struktur placeholder `<div id="category-filter-bar">`
    - Implementasikan fungsi `buildCategoryFilters(exercises)` yang mengekstrak nilai unik dari kolom `category` latihan published, kemudian merender tombol "Semua" + satu tombol per kategori unik
    - Ganti pemanggilan `setupCategoryButtons()` dengan `buildCategoryFilters(allPublishedExercises)` setelah data dimuat
    - Re-attach event listener di dalam `buildCategoryFilters` agar filter bekerja setelah re-render
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 8. Checkpoint — Pastikan semua tes lulus, tanyakan ke user jika ada pertanyaan.

- [x] 9. Optimasi Performa
  - [x] 9.1 Tambahkan resource hints ke `<head>` semua halaman
    - Tambahkan `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>`, `<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">`, `<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, `<link rel="dns-prefetch" href="https://fonts.gstatic.com">` di `<head>` semua halaman siswa (`Dashboard.html`, `Materi.html`, `Budaya.html`, `Latihan.html`, `Laporan.html`, `Pengaturan.html`, `latihan-supabase.html`) dan halaman admin
    - _Requirements: 15.2_

  - [x] 9.2 Pin versi Supabase JS dan audit lazy loading gambar di semua halaman
    - Ganti semua `@supabase/supabase-js@2` (floating) dengan `@supabase/supabase-js@2.49.1` (pinned) di seluruh halaman yang memuat dari CDN
    - Tambahkan `loading="lazy"` pada semua `<img>` below-the-fold di semua halaman Student Dashboard dan Admin Panel yang belum memilikinya
    - _Requirements: 15.1, 15.4_

  - [x] 9.3 Buat `tailwind.config.js` di root proyek dan perbarui `README.md`
    - Buat file `tailwind.config.js` di `/Users/ibnufajar/Documents/project/KANUM/` yang mencakup semua token warna, spacing, typography, dan `content` pointing ke semua HTML files
    - Tambahkan instruksi build Tailwind CLI di `README.md`: cara install `@tailwindcss/cli`, perintah build, dan cara generate minified CSS untuk produksi
    - _Requirements: 15.3_

- [x] 10. Mobile-First UI Review Semua Halaman
  - [x] 10.1 Audit dan perbaiki `Login/Daftar.html` dan `Login/Masuk.html` untuk mobile-first
    - Pastikan form registrasi dan login menggunakan layout single-column di mobile, dua-kolom hanya mulai `md:`
    - Pastikan font size, padding, dan spacing menggunakan nilai mobile-first lalu `md:` untuk desktop
    - Pastikan tombol CTA memiliki ukuran minimum `44px` touch target
    - _Requirements: Tambahan mobile-first_

  - [x] 10.2 Audit dan perbaiki halaman Student Dashboard untuk mobile-first
    - `Dashboard.html`: grid statistik `grid-cols-1 md:grid-cols-3`, hero card full-width di mobile, sidebar hanya `md:flex`, bottom nav hanya tampil di mobile
    - `Materi.html`: grid kartu `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, filter bar `flex-wrap`, hero section min-height dikecilkan di mobile
    - `Budaya.html`: grid kartu `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`, hero section stack vertikal di mobile
    - `Laporan.html`: ringkasan stats `grid-cols-1 sm:grid-cols-3`, daftar aktivitas full-width, padding `p-4 md:p-10`
    - `Pengaturan.html`: grid input `grid-cols-1 md:grid-cols-2`, tombol aksi full-width di mobile
    - `Latihan.html`: grid latihan `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, filter bar `flex-wrap gap-2`
    - _Requirements: Tambahan mobile-first_

  - [x] 10.3 Audit dan perbaiki halaman Admin Panel untuk mobile-first
    - `Admin/index.html`, `Admin/latihan.html`, `Admin/soal.html`, `Admin/progres.html`, `Admin/materi.html`, `Admin/budaya.html`: sidebar hanya tampil mulai `md:`, tambahkan hamburger menu atau collapse untuk mobile
    - Stats row di dashboard admin: `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))` agar muat di layar kecil
    - Tabel admin: tambahkan `overflow-x: auto` wrapper agar bisa di-scroll horizontal di mobile
    - Modal: pastikan `max-width: 95vw`, `max-height: 90vh`, `overflow-y: auto`
    - _Requirements: Tambahan mobile-first_

- [x] 11. Checkpoint — Pastikan semua tes lulus, tanyakan ke user jika ada pertanyaan.

- [x] 12. Cleanup dan Housekeeping
  - [x] 12.1 Hapus file sampah dan perbarui `.gitignore`
    - Verifikasi tidak ada HTML yang `import` atau `<script src>` file `temp.js` atau `test-supabase.js`
    - Hapus file `temp.js` dari root proyek
    - Hapus file `test-supabase.js` dari root proyek
    - Tambahkan pola `temp*.js` dan `test-*.js` ke `.gitignore`
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

---

## Notes

- Task bertanda `*` adalah opsional dan bisa dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Checkpoint memastikan validasi inkremental setiap fase
- Semua perubahan UI harus menggunakan pendekatan **mobile-first**: desain untuk layar kecil dulu, kemudian tambahkan `sm:`, `md:`, `lg:` responsive prefixes
- Untuk schema.sql: semua fungsi menggunakan `CREATE OR REPLACE` agar migrasi bisa dijalankan ulang tanpa error
- Untuk halaman admin baru: gunakan `Admin/latihan.html` sebagai referensi pola yang sudah ada (sidebar, topbar, modal, auth check)
- File `supabase.js` **tidak diubah** strukturnya — hanya digunakan oleh semua halaman sebagai shared client

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "id": 3, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 4, "tasks": ["6.5", "7.1", "7.2"] },
    { "id": 5, "tasks": ["7.3", "7.4"] },
    { "id": 6, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 8, "tasks": ["12.1"] }
  ]
}
```

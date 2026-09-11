# Requirements Document

## Introduction

KANUM Routing Refactor adalah pembaruan arsitektur pada platform edukasi KANUM (Kajang Numerasi) yang bertujuan menerapkan URL bersih (clean URL), sistem auth guard terpusat, build Tailwind CSS lokal, dan pemisahan JavaScript inline ke file terpisah — tanpa mengubah desain UI yang sudah ada. Refactor ini mempersiapkan proyek untuk migrasi ke Next.js di masa depan.

Platform KANUM adalah aplikasi web statis Multi-Page Application (MPA) berbasis vanilla HTML/CSS/JS dengan Supabase sebagai backend, di-deploy ke Vercel.

---

## Glossary

- **KANUM**: Platform edukasi etnomatematika Kajang Numerasi.
- **Vercel Rewrites**: Konfigurasi `vercel.json` yang memetakan clean URL ke file `.html` fisik.
- **Clean URL**: URL tanpa ekstensi `.html`, misalnya `/dashboard` menggantikan `/Dashboard%20Siswa/Dashboard.html`.
- **Guard.js**: File JavaScript terpusat yang menangani autentikasi dan otorisasi halaman.
- **PAGE_ROLE**: Variabel global JavaScript yang ditetapkan di setiap halaman untuk menyatakan kebutuhan akses (`public`, `student`, `admin`).
- **Supabase**: Backend-as-a-Service yang digunakan untuk autentikasi dan database.
- **RLS**: Row-Level Security — kebijakan akses data di level database Supabase.
- **MPA**: Multi-Page Application — setiap halaman adalah file `.html` tersendiri.
- **Tailwind CLI**: Alat build Tailwind CSS berbasis Node.js yang menghasilkan file CSS statis ter-purge.
- **CDN Tailwind**: Tag `<script>` CDN Tailwind yang saat ini digunakan dan akan dihapus.
- **Admin**: Pengguna dengan `role = 'admin'` di tabel `profiles` Supabase.
- **Siswa**: Pengguna dengan `role = 'student'` di tabel `profiles` Supabase.

---

## Requirements

### Requirement 1 — Konfigurasi Clean URL via Vercel Rewrites

**User Story:** Sebagai pengguna KANUM, saya ingin mengakses halaman melalui URL bersih tanpa ekstensi `.html` dan tanpa path folder, sehingga URL lebih mudah dibaca dan konsisten.

#### Acceptance Criteria

1. THE Vercel Rewrites Configuration SHALL memetakan clean URL berikut ke file `.html` fisik yang sesuai:
   - `/` → `Landing/index.html`
   - `/login` → `Login/Masuk.html`
   - `/daftar` → `Login/Daftar.html`
   - `/dashboard` → `Dashboard Siswa/Dashboard.html`
   - `/materi` → `Dashboard Siswa/Materi.html`
   - `/materi/:id` → `Dashboard Siswa/materi-detail.html`
   - `/budaya` → `Dashboard Siswa/Budaya.html`
   - `/budaya/:id` → `Dashboard Siswa/budaya-detail.html`
   - `/latihan` → `Dashboard Siswa/Latihan.html`
   - `/latihan/quiz` → `Dashboard Siswa/latihan-supabase.html`
   - `/laporan` → `Dashboard Siswa/Laporan.html`
   - `/pengaturan` → `Dashboard Siswa/Pengaturan.html`
   - `/admin` → `Admin/index.html`
   - `/admin/latihan` → `Admin/latihan.html`
   - `/admin/soal` → `Admin/soal.html`
   - `/admin/materi` → `Admin/materi.html`
   - `/admin/budaya` → `Admin/budaya.html`
   - `/admin/progres` → `Admin/progres.html`

2. THE Vercel Rewrites Configuration SHALL mendefinisikan seluruh route dalam satu file `vercel.json` di root proyek.

3. WHEN pengguna mengakses clean URL yang terdaftar, THE Vercel Rewrites Configuration SHALL melayani file `.html` yang sesuai tanpa melakukan redirect (status 200, bukan 301/302).

4. IF clean URL yang diminta tidak cocok dengan route yang terdaftar, THEN THE Vercel Rewrites Configuration SHALL mengembalikan respons 404.

---

### Requirement 2 — Centralized Auth Guard (guard.js)

**User Story:** Sebagai developer KANUM, saya ingin satu file `guard.js` yang menangani semua logika autentikasi dan otorisasi halaman, sehingga tidak ada duplikasi kode auth di setiap file HTML.

#### Acceptance Criteria

1. THE Guard System SHALL menyediakan satu file `guard.js` yang digunakan oleh semua halaman yang memerlukan perlindungan akses.

2. THE Guard System SHALL membaca nilai variabel global `PAGE_ROLE` yang ditetapkan oleh halaman sebelum `guard.js` dimuat.

3. WHEN `PAGE_ROLE` bernilai `'public'`, THE Guard System SHALL mengizinkan akses tanpa memeriksa sesi Supabase.

4. WHEN `PAGE_ROLE` bernilai `'student'`, THE Guard System SHALL memeriksa sesi Supabase aktif dan mengarahkan ke `/login` jika sesi tidak ditemukan.

5. WHEN `PAGE_ROLE` bernilai `'student'` dan sesi ditemukan dengan `role = 'admin'`, THE Guard System SHALL mengarahkan pengguna ke `/admin`.

6. WHEN `PAGE_ROLE` bernilai `'admin'`, THE Guard System SHALL memeriksa sesi Supabase aktif dan mengarahkan ke `/login` jika sesi tidak ditemukan.

7. WHEN `PAGE_ROLE` bernilai `'admin'` dan sesi ditemukan dengan `role = 'student'`, THE Guard System SHALL mengarahkan pengguna ke `/dashboard`.

8. WHEN `PAGE_ROLE` bernilai `'admin'` dan sesi ditemukan dengan `role = 'admin'`, THE Guard System SHALL mengizinkan akses ke halaman admin.

9. WHEN `PAGE_ROLE` bernilai `'student'` dan sesi ditemukan dengan `role = 'student'`, THE Guard System SHALL menyimpan data profil pengguna ke `localStorage` dengan kunci `etno_user_name` dan `etno_user_class`.

10. THE Guard System SHALL menyelesaikan pemeriksaan sesi sebelum konten halaman dirender ke layar, untuk mencegah flash konten terproteksi.

11. IF `PAGE_ROLE` tidak didefinisikan pada halaman, THEN THE Guard System SHALL memperlakukan halaman sebagai `'public'`.

---

### Requirement 3 — Pembaruan Navigasi Internal ke Clean URL

**User Story:** Sebagai pengguna KANUM, saya ingin semua tautan navigasi di seluruh halaman menggunakan clean URL, sehingga pengalaman navigasi konsisten dan tidak ada link yang rusak.

#### Acceptance Criteria

1. THE Navigation Links SHALL menggunakan clean URL pada seluruh atribut `href` di sidebar, topbar, bottom nav, dan kartu konten di semua halaman.

2. THE dashboard.js Navigation Module SHALL memperbarui array `pages` sehingga nilai `href` setiap halaman menggunakan clean URL (contoh: `/dashboard`, `/materi`, `/latihan`).

3. WHEN pengguna klik link navigasi menggunakan clean URL, THE Navigation Links SHALL membawa pengguna ke halaman yang benar tanpa error 404.

4. THE Login Page SHALL mengarahkan pengguna ke `/dashboard` (siswa) atau `/admin` (admin) setelah login berhasil, bukan ke path file `.html` lama.

5. THE Logout Function SHALL mengarahkan pengguna ke `/login` setelah logout, bukan ke path relatif `../Login/Masuk.html`.

6. THE Navigation Links SHALL menghapus semua penggunaan `href="#"` yang merupakan placeholder navigasi antar halaman dan menggantinya dengan clean URL yang benar.

---

### Requirement 4 — Build Tailwind CSS Lokal dan Penghapusan CDN

**User Story:** Sebagai developer KANUM, saya ingin Tailwind CSS di-build secara lokal menggunakan Tailwind CLI, sehingga file CSS ter-purge, lebih kecil, dan tidak bergantung pada CDN saat runtime.

#### Acceptance Criteria

1. THE Tailwind Build System SHALL menghasilkan satu file CSS statis ter-purge di `dist/tailwind.min.css` menggunakan Tailwind CLI.

2. THE Tailwind Build System SHALL membaca konfigurasi token warna dari `tailwind.config.js` yang sudah ada tanpa mengubahnya.

3. THE Tailwind Build System SHALL menyertakan `@tailwind base`, `@tailwind components`, dan `@tailwind utilities` melalui file `input.css` di root proyek.

4. THE Tailwind Build System SHALL menjalankan build dengan flag `--minify` untuk menghasilkan file produksi yang dimampatkan.

5. WHEN build Tailwind CLI dijalankan, THE Tailwind Build System SHALL menghasilkan file `dist/tailwind.min.css` yang berisi hanya class Tailwind yang benar-benar digunakan di file HTML dan JS.

6. THE HTML Pages SHALL mengganti semua tag `<script src="...cdn.tailwindcss.com...">` atau tag CDN Tailwind serupa dengan `<link rel="stylesheet" href="/dist/tailwind.min.css">`.

7. THE HTML Pages SHALL mempertahankan seluruh tampilan dan layout yang sudah ada setelah penggantian CDN ke file lokal, tanpa perubahan visual yang tidak disengaja.

8. IF file `dist/tailwind.min.css` tidak ditemukan saat halaman dibuka, THEN THE HTML Pages SHALL menampilkan halaman tanpa styling (graceful degradation) tanpa error JavaScript.

---

### Requirement 5 — Pemisahan JavaScript Inline ke File Terpisah

**User Story:** Sebagai developer KANUM, saya ingin JavaScript yang saat ini ditulis inline di dalam tag `<script>` di file HTML dipindahkan ke file `.js` terpisah per halaman, sehingga kode lebih mudah dibaca, dipelihara, dan dimigrasi ke Next.js.

#### Acceptance Criteria

1. THE JavaScript Refactor SHALL memindahkan semua blok `<script>` inline yang berisi logika bisnis dari setiap file HTML ke file `.js` yang bersesuaian.

2. THE JavaScript Refactor SHALL menempatkan file `.js` halaman di direktori yang sama dengan file `.html` yang bersangkutan (contoh: `Dashboard Siswa/dashboard-page.js` untuk `Dashboard.html`).

3. THE HTML Pages SHALL memuat file `.js` halaman menggunakan tag `<script src="nama-file.js" defer></script>` menggantikan blok `<script>` inline.

4. THE JavaScript Refactor SHALL mempertahankan semua fungsionalitas yang ada — tidak ada fitur yang hilang atau berubah perilaku setelah pemisahan.

5. THE JavaScript Files SHALL tidak menduplikasi logika yang sudah ada di `supabase.js`, `guard.js`, atau `dashboard.js`; melainkan menggunakan fungsi yang sudah tersedia secara global.

6. WHERE halaman memiliki lebih dari satu blok `<script>` inline, THE JavaScript Refactor SHALL menggabungkan seluruh logika halaman ke dalam satu file `.js` per halaman.

7. THE JavaScript Files SHALL menggunakan IIFE (Immediately Invoked Function Expression) atau ES module pattern untuk menghindari polusi namespace global, konsisten dengan pola yang sudah digunakan di `dashboard.js`.

---

### Requirement 6 — Struktur Folder Bersih dan Siap Migrasi Next.js

**User Story:** Sebagai developer KANUM, saya ingin struktur folder proyek yang konsisten dan mudah dipahami, sehingga proses migrasi ke Next.js di masa depan dapat dilakukan dengan lancar.

#### Acceptance Criteria

1. THE Project Structure SHALL mempertahankan semua folder dan file yang sudah ada tanpa memindahkan atau menghapus file `.html`, `.css`, atau aset gambar yang sudah ada.

2. THE Project Structure SHALL menempatkan file JavaScript baru hasil refactor di folder yang sama dengan file HTML yang bersangkutan.

3. THE Project Structure SHALL menempatkan file `guard.js` di root proyek atau di folder `assets/js/` agar dapat diakses oleh semua halaman menggunakan path absolut.

4. THE Project Structure SHALL menyertakan file `dist/tailwind.min.css` yang dihasilkan oleh Tailwind CLI di folder `dist/`.

5. THE Project Structure SHALL mendefinisikan script npm di `package.json` untuk menjalankan build Tailwind CSS: `"build:css"` untuk produksi dan `"watch:css"` untuk development.

6. THE Project Structure SHALL menyertakan `dist/` dan `node_modules/` dalam `.gitignore` agar tidak ter-commit ke repositori.

7. THE Project Structure SHALL menyertakan file `vercel.json` di root proyek yang berisi seluruh konfigurasi rewrite clean URL.

8. THE README SHALL diperbarui dengan instruksi langkah-langkah setup baru: instalasi dependensi, build CSS, dan cara menjalankan proyek lokal menggunakan rewrite yang benar.

# Requirements Document

## Introduction

KANUM (Kajang Numerasi) adalah aplikasi web etnomatematika berbasis vanilla HTML/CSS/JS dan Supabase yang ditujukan untuk siswa SMP. Aplikasi ini mengintegrasikan pembelajaran matematika dengan kearifan budaya Ammatoa Kajang. Dokumen ini mendefinisikan seluruh kebutuhan perbaikan dan optimasi menyeluruh yang mencakup 15 isu kritis, sedang, dan minor agar KANUM berfungsi sepenuhnya, ringan, dan siap untuk penelitian maupun lingkungan produksi.

Scope teknologi: vanilla HTML/CSS/JS, Supabase (PostgreSQL + Auth + Storage), tanpa framework JavaScript. Halaman siswa berada di `Dashboard Siswa/`, halaman admin di `Admin/`, login di `Login/`.

---

## Glossary

- **System**: Aplikasi web KANUM secara keseluruhan.
- **Auth Module**: Modul autentikasi berbasis Supabase Auth yang tersedia melalui `supabase.js`.
- **Supabase Client (`_sb`)**: Instance klien Supabase yang dideklarasikan di `supabase.js` dan digunakan oleh semua halaman.
- **RPC Quiz**: Dua fungsi PostgreSQL — `get_student_quiz` dan `submit_student_quiz` — yang menangani pengambilan soal dan pengiriman jawaban siswa secara aman.
- **Student Dashboard**: Kumpulan halaman siswa: `Dashboard.html`, `Materi.html`, `Budaya.html`, `Latihan.html`, `latihan-supabase.html`, `Laporan.html`, `Pengaturan.html`.
- **Admin Panel**: Kumpulan halaman admin: `Admin/index.html`, `Admin/latihan.html`, `Admin/soal.html`, `Admin/progres.html`.
- **Shell Script (`dashboard.js`)**: Skrip yang menyuntikkan sidebar dan topbar yang konsisten ke semua halaman siswa.
- **Profile Table**: Tabel `public.profiles` di Supabase yang menyimpan data pengguna termasuk `full_name`, `class_name`, `email`, dan `role`.
- **Student Progress Table**: Tabel `public.student_progress` yang menyimpan ringkasan progres siswa per latihan.
- **Content Tables**: Tabel-tabel baru `public.materi` dan `public.budaya` yang menyimpan konten dinamis materi dan budaya.
- **Guru**: Pengguna yang mendaftar dengan peran "Guru" pada halaman `Daftar.html`.
- **Admin**: Pengguna dengan `role = 'admin'` di tabel `public.profiles`.
- **CDN**: Content Delivery Network yang digunakan untuk memuat library eksternal (Tailwind CSS, Supabase JS).
- **Lazy Load**: Teknik penundaan pemuatan gambar hingga gambar tersebut mendekati viewport.

---

## Requirements

### Requirement 1 — RPC PostgreSQL untuk Sistem Kuis

**User Story:** Sebagai siswa, saya ingin mengerjakan latihan soal tanpa bisa melihat atau memanipulasi kunci jawaban, sehingga hasil yang saya peroleh mencerminkan kemampuan nyata saya.

#### Acceptance Criteria

1. THE System SHALL menyediakan fungsi PostgreSQL bernama `get_student_quiz` dengan parameter `p_exercise_id UUID` yang mengembalikan data latihan, daftar soal, dan pilihan jawaban tanpa menyertakan kolom `is_correct` pada respons.
2. THE System SHALL menyediakan fungsi PostgreSQL bernama `submit_student_quiz` dengan parameter `p_attempt_id UUID` dan `p_answers JSONB` yang melakukan penilaian jawaban, menyimpan hasil ke tabel `student_answers` dan `exercise_attempts`, serta mengembalikan `score`, `correct_count`, `wrong_count`, dan `review` berisi kunci jawaban.
3. WHEN `get_student_quiz` dipanggil, THE System SHALL membuat record baru di tabel `exercise_attempts` dengan status `in_progress` dan mengembalikan `attempt_id` tersebut kepada pemanggil.
4. WHEN `submit_student_quiz` dipanggil dengan `p_attempt_id` yang tidak dimiliki oleh pengguna yang sedang login, THE System SHALL mengembalikan error PostgreSQL dengan kode `42501` (insufficient privilege).
5. WHEN `get_student_quiz` dipanggil untuk latihan dengan `is_published = false`, THE System SHALL mengembalikan error jika pemanggil bukan admin.
6. THE System SHALL menambahkan definisi kedua fungsi RPC ini ke file `Supabase/schema.sql` sebagai migrasi yang dapat dijalankan ulang.

---

### Requirement 2 — Logout Aman di Semua Halaman

**User Story:** Sebagai pengguna, saya ingin tombol logout pada setiap halaman benar-benar mengakhiri sesi Supabase saya, sehingga akun saya tidak dapat diakses oleh orang lain di perangkat yang sama.

#### Acceptance Criteria

1. WHEN pengguna mengklik tautan atau tombol logout pada halaman mana pun di Student Dashboard, THE Auth Module SHALL memanggil `_sb.auth.signOut()` sebelum melakukan redirect ke `Login/Masuk.html`.
2. WHEN pengguna mengklik tombol logout pada halaman mana pun di Admin Panel, THE Auth Module SHALL memanggil `_sb.auth.signOut()` sebelum melakukan redirect ke `Login/Masuk.html`.
3. THE System SHALL mengganti setiap tautan `<a href="../Login/Masuk.html">` yang berfungsi sebagai logout dengan elemen `<button>` yang memanggil `_sb.auth.signOut()` secara asinkron pada halaman: `Dashboard Siswa/Laporan.html`, `Dashboard Siswa/Pengaturan.html`, `Dashboard Siswa/Materi.html`, `Dashboard Siswa/Budaya.html`, dan semua halaman Admin Panel.
4. IF `_sb.auth.signOut()` mengembalikan error, THEN THE System SHALL tetap melakukan redirect ke `Login/Masuk.html` dan menampilkan pesan toast berisi teks error tersebut.

---

### Requirement 3 — Dashboard Siswa Menampilkan Data Real

**User Story:** Sebagai siswa, saya ingin dashboard saya menampilkan statistik belajar yang nyata dari aktivitas saya, sehingga saya dapat memantau progres belajar secara akurat.

#### Acceptance Criteria

1. WHEN `Dashboard.html` dimuat, THE Student Dashboard SHALL mengambil data profil pengguna dari tabel `public.profiles` menggunakan `session.user.id` dan menampilkan `full_name` pada sapaan dan topbar.
2. WHEN `Dashboard.html` dimuat, THE Student Dashboard SHALL mengambil ringkasan progres dari tabel `public.student_progress` untuk pengguna yang sedang login dan menampilkan jumlah latihan selesai, jumlah latihan yang dikerjakan, dan rata-rata skor.
3. THE Student Dashboard SHALL mengganti seluruh pembacaan data dari `localStorage` (`etno_completed_chapters`, `etno_quiz_score_*`) di `Dashboard.html` dengan data yang diambil dari Supabase.
4. IF pengambilan data dari Supabase gagal, THEN THE Student Dashboard SHALL menampilkan nilai default "–" pada semua kartu statistik dan menampilkan pesan toast dengan detail error.

---

### Requirement 4 — Registrasi Role Guru sebagai Admin

**User Story:** Sebagai guru, saya ingin mendaftar dengan memilih peran "Guru" dan langsung mendapatkan akses admin, sehingga saya dapat mengelola konten tanpa konfigurasi manual tambahan.

#### Acceptance Criteria

1. WHEN pengguna mendaftar dengan radio button `role = 'guru'` pada `Daftar.html`, THE Auth Module SHALL meneruskan `role: 'teacher'` pada `options.data` saat memanggil `_sb.auth.signUp()`.
2. THE System SHALL memperbarui fungsi trigger PostgreSQL `handle_new_user` di `Supabase/schema.sql` sehingga WHEN `raw_user_meta_data->>'role'` bernilai `'teacher'`, THEN THE System SHALL menyimpan `role = 'admin'` di tabel `public.profiles`.
3. WHEN pendaftaran dengan peran Guru berhasil dan email telah diverifikasi, THE Auth Module SHALL mengarahkan pengguna ke `Admin/index.html` setelah login berhasil, mengikuti logika yang sudah ada di `Masuk.html` yang memeriksa `profile.role === 'admin'`.
4. IF pengguna mendaftar sebagai Guru tetapi email belum diverifikasi, THEN THE System SHALL menampilkan pesan yang menginstruksikan pengguna untuk memeriksa email verifikasi, dan redirect ke `Admin/index.html` hanya terjadi setelah verifikasi selesai.

---

### Requirement 5 — Konten Materi dan Budaya Dinamis dari Supabase

**User Story:** Sebagai admin, saya ingin mengelola konten materi dan budaya melalui panel admin, sehingga konten dapat diperbarui tanpa mengubah kode HTML secara manual.

#### Acceptance Criteria

1. THE System SHALL membuat tabel `public.materi` di Supabase dengan kolom minimal: `id UUID`, `title TEXT`, `chapter_number INT`, `level TEXT CHECK ('dasar','menengah','lanjut')`, `description TEXT`, `duration_minutes INT`, `image_url TEXT`, `content_html TEXT`, `is_published BOOLEAN`, `sort_order INT`, `created_at TIMESTAMPTZ`.
2. THE System SHALL membuat tabel `public.budaya` di Supabase dengan kolom minimal: `id UUID`, `title TEXT`, `topic_key TEXT UNIQUE`, `category TEXT`, `description TEXT`, `image_url TEXT`, `content_html TEXT`, `is_published BOOLEAN`, `sort_order INT`, `created_at TIMESTAMPTZ`.
3. WHEN `Materi.html` dimuat, THE Student Dashboard SHALL mengambil semua baris dari `public.materi` dengan `is_published = true` diurutkan berdasarkan `sort_order` dan merender kartu bab secara dinamis menggantikan markup statis yang ada.
4. WHEN `Budaya.html` dimuat, THE Student Dashboard SHALL mengambil semua baris dari `public.budaya` dengan `is_published = true` diurutkan berdasarkan `sort_order` dan merender kartu budaya secara dinamis menggantikan markup statis yang ada.
5. THE System SHALL menambahkan dua halaman baru di Admin Panel: `Admin/materi.html` dan `Admin/budaya.html`, masing-masing dengan form modal untuk operasi buat, baca, perbarui, dan hapus konten pada tabel yang bersangkutan.
6. THE System SHALL menambahkan tautan navigasi ke `Admin/materi.html` dan `Admin/budaya.html` pada sidebar semua halaman Admin Panel.
7. WHERE RLS (Row Level Security) diaktifkan, THE System SHALL menerapkan kebijakan bahwa siswa hanya dapat membaca baris dengan `is_published = true`, sementara admin dapat melakukan semua operasi.

---

### Requirement 6 — Halaman Laporan Siswa Menampilkan Data Real

**User Story:** Sebagai siswa, saya ingin melihat laporan belajar saya yang berisi data nyata dari setiap latihan yang telah saya kerjakan, sehingga saya dapat mengevaluasi perkembangan belajar saya.

#### Acceptance Criteria

1. WHEN `Laporan.html` dimuat, THE Student Dashboard SHALL mengambil data dari tabel `public.student_progress` yang di-join dengan `public.exercises` untuk pengguna yang sedang login dan menampilkan ringkasan: jumlah latihan dikerjakan, rata-rata skor, dan jumlah latihan lulus.
2. WHEN `Laporan.html` dimuat, THE Student Dashboard SHALL mengambil riwayat percobaan dari tabel `public.exercise_attempts` untuk pengguna yang sedang login, diurutkan berdasarkan `started_at DESC`, dan menampilkannya sebagai daftar aktivitas terbaru.
3. THE Student Dashboard SHALL mengganti seluruh pembacaan data dari `localStorage` di `Laporan.html` dengan data yang diambil dari Supabase.
4. IF pengguna belum mengerjakan latihan apa pun, THEN THE Student Dashboard SHALL menampilkan pesan "Belum ada aktivitas latihan. Silakan kunjungi menu Latihan!" pada area aktivitas terbaru.
5. IF pengambilan data dari Supabase gagal, THEN THE Student Dashboard SHALL menampilkan nilai default "–" pada semua kartu statistik dan menampilkan pesan toast dengan detail error.

---

### Requirement 7 — Halaman Pengaturan Memperbarui Profil ke Supabase

**User Story:** Sebagai siswa, saya ingin menyimpan perubahan profil saya (nama dan kelas) sehingga data tersebut tersimpan secara permanen di database dan ditampilkan secara konsisten di seluruh aplikasi.

#### Acceptance Criteria

1. WHEN `Pengaturan.html` dimuat, THE Student Dashboard SHALL mengambil data profil dari tabel `public.profiles` menggunakan `session.user.id` dan mengisi nilai `full_name`, `class_name`, dan `email` pada masing-masing field input secara otomatis.
2. WHEN pengguna mengklik tombol "Simpan" pada `Pengaturan.html`, THE Student Dashboard SHALL memanggil `_sb.from('profiles').update({full_name, class_name}).eq('id', session.user.id)` dan menampilkan toast "Profil berhasil disimpan" jika berhasil.
3. IF operasi update gagal, THEN THE Student Dashboard SHALL menampilkan toast berisi pesan error dari Supabase dan tidak melakukan redirect.
4. THE Student Dashboard SHALL memperbarui nilai `localStorage.setItem('etno_user_name', full_name)` dan `localStorage.setItem('etno_user_class', class_name)` setelah update berhasil, agar topbar yang dirender oleh `dashboard.js` langsung mencerminkan nama terbaru tanpa perlu reload halaman.

---

### Requirement 8 — Navigasi Konsisten Menggunakan dashboard.js di Semua Halaman Siswa

**User Story:** Sebagai siswa, saya ingin sidebar dan topbar yang konsisten tampil di setiap halaman dashboard, sehingga navigasi saya selalu seragam dan dapat diprediksi.

#### Acceptance Criteria

1. THE System SHALL memastikan `<script src="dashboard.js"></script>` (atau path relatif yang setara) dimuat sebagai script terakhir sebelum `</body>` pada semua halaman Student Dashboard: `Dashboard.html`, `Materi.html`, `Budaya.html`, `Latihan.html`, `latihan-supabase.html`, `Laporan.html`, `Pengaturan.html`, `materi-detail.html`, `budaya-detail.html`, dan `latihan-detail.html`.
2. THE Shell Script SHALL mengenali slug halaman `Laporan` dan `Pengaturan` sebagai halaman valid dalam array `pages` sehingga tautan navigasi yang bersangkutan mendapat class `is-active` dengan benar.
3. THE System SHALL menghapus sidebar dan topbar yang dideklarasikan secara statis (markup `<aside>` dan `<header>` bawaan) dari halaman-halaman yang sudah menggunakan `dashboard.js` untuk mencegah duplikasi elemen navigasi.
4. WHEN halaman `latihan-supabase.html` dimuat, THE Shell Script SHALL mempertahankan elemen `<aside class="quiz-side-panel">` dan tidak menghapusnya, sesuai dengan logika selektif `aside:not(.quiz-side-panel)` yang sudah ada.

---

### Requirement 9 — Hapus Duplikasi Load supabase.js di Latihan.html

**User Story:** Sebagai developer, saya ingin setiap halaman memuat `supabase.js` tepat satu kali, sehingga tidak ada konflik variabel global `_sb` yang dapat menyebabkan error tidak terduga.

#### Acceptance Criteria

1. THE System SHALL memastikan `supabase.js` dimuat tepat satu kali di `Dashboard Siswa/Latihan.html`, menghapus salah satu dari dua tag `<script src="/supabase.js"></script>` yang saat ini ada di file tersebut.
2. THE System SHALL memindahkan tag `<script src="../supabase.js">` ke bagian `<head>` atau ke posisi yang konsisten dengan halaman-halaman lain di Student Dashboard agar urutan pemuatan dapat diprediksi.
3. THE System SHALL melakukan audit dan memeriksa semua halaman di `Dashboard Siswa/` untuk memastikan tidak ada halaman lain yang memuat `supabase.js` lebih dari satu kali.

---

### Requirement 10 — Topbar Menampilkan Nama Pengguna Real

**User Story:** Sebagai siswa, saya ingin topbar menampilkan nama asli saya setelah login, bukan nama hardcoded "Miftah", sehingga pengalaman belajar terasa personal.

#### Acceptance Criteria

1. WHEN `dashboard.js` membangun shell navigasi, THE Shell Script SHALL membaca `full_name` dari `localStorage` dengan key `etno_user_name`; WHEN key tersebut tidak tersedia, THE Shell Script SHALL menampilkan teks "Pengguna" sebagai nilai default.
2. WHEN halaman mana pun di Student Dashboard selesai dimuat dan sesi aktif tersedia, THE Student Dashboard SHALL mengambil `full_name` dan `class_name` dari tabel `public.profiles` dan menyimpannya ke `localStorage` dengan key `etno_user_name` dan `etno_user_class`.
3. THE System SHALL memastikan nama pengguna "Miftah" yang ditulis statis di `Dashboard.html` (pada sapaan `h1` dan kartu topbar) diganti dengan mekanisme pembacaan dinamis dari profil Supabase.
4. WHEN data profil berhasil diambil setelah halaman dirender, THE Student Dashboard SHALL memperbarui elemen DOM yang menampilkan nama pengguna tanpa melakukan reload halaman penuh.

---

### Requirement 11 — Perbaikan Path Gambar yang Rusak di Dashboard.html

**User Story:** Sebagai siswa, saya ingin semua gambar pada halaman Dashboard tampil dengan benar, sehingga tampilan visual tidak terganggu oleh gambar yang tidak termuat.

#### Acceptance Criteria

1. THE System SHALL memverifikasi dan memperbaiki setiap path `src` gambar di `Dashboard.html` yang merujuk ke file di `Asset/Images/` yang tidak ada (misalnya `sejarahammatoa.png`, `prosesmenenun.png`, `polamatematika.png`) dengan menggantikannya menggunakan nama file yang sesuai berdasarkan daftar file aktual di direktori `Asset/Images/`.
2. THE System SHALL menambahkan atribut `loading="lazy"` pada setiap elemen `<img>` yang berada di luar area tampilan awal (below-the-fold) di `Dashboard.html`.
3. IF sebuah gambar gagal dimuat (event `onerror`), THEN THE System SHALL menampilkan placeholder berupa elemen `<div>` dengan warna background `var(--etno-surface-high)` sebagai fallback visual.

---

### Requirement 12 — Perbaikan Tautan Terms of Service di Daftar.html

**User Story:** Sebagai calon pengguna, saya ingin tautan Syarat & Ketentuan dan Kebijakan Privasi pada halaman registrasi mengarah ke halaman yang bermakna, sehingga saya dapat membaca ketentuan sebelum mendaftar.

#### Acceptance Criteria

1. THE System SHALL mengganti tautan `href="../Docs/04-DEVELOPMENT-RULES.md"` pada `Daftar.html` dengan URL yang mengarah ke halaman atau section yang berisi Syarat & Ketentuan KANUM yang dapat dibaca oleh pengguna akhir.
2. THE System SHALL mengganti tautan `href="../Docs/DESIGN.md"` pada `Daftar.html` dengan URL yang mengarah ke halaman atau section yang berisi Kebijakan Privasi KANUM yang dapat dibaca oleh pengguna akhir.
3. WHERE halaman Syarat & Ketentuan dan Kebijakan Privasi belum ada sebagai halaman tersendiri, THE System SHALL membuat file `Landing/terms.html` dan `Landing/privacy.html` yang berisi konten minimal yang relevan, dan memperbarui kedua tautan tersebut.

---

### Requirement 13 — Kategori Filter Latihan Dinamis dari Database

**User Story:** Sebagai siswa, saya ingin tombol filter kategori di halaman Latihan menampilkan hanya kategori yang benar-benar tersedia di database, sehingga saya tidak melihat tombol filter untuk kategori yang tidak memiliki latihan.

#### Acceptance Criteria

1. WHEN `Latihan.html` dimuat dan data latihan berhasil diambil dari Supabase, THE Student Dashboard SHALL mengekstrak daftar nilai unik dari kolom `category` pada latihan yang `is_published = true` dan merender tombol filter secara dinamis di elemen `#category-filter-bar`.
2. THE Student Dashboard SHALL selalu menyertakan tombol "Semua" sebagai opsi pertama di filter bar, dengan perilaku yang sama seperti saat ini.
3. THE Student Dashboard SHALL menghapus tombol filter kategori yang dideklarasikan secara statis ("Geometri", "Bilangan", "Aritmatika Sosial", "Aljabar") dari markup HTML `Latihan.html` dan menggantinya dengan placeholder yang akan diisi secara dinamis.
4. IF tidak ada latihan yang dipublikasikan dalam suatu kategori, THEN THE Student Dashboard SHALL tidak menampilkan tombol filter untuk kategori tersebut.

---

### Requirement 14 — Penghapusan File Sampah

**User Story:** Sebagai developer, saya ingin direktori root proyek bersih dari file yang tidak diperlukan, sehingga ukuran repository terjaga dan tidak ada kebingungan tentang file yang aktif digunakan.

#### Acceptance Criteria

1. THE System SHALL menghapus file `temp.js` dari direktori root proyek KANUM.
2. THE System SHALL menghapus file `test-supabase.js` dari direktori root proyek KANUM.
3. THE System SHALL memverifikasi bahwa tidak ada file HTML mana pun yang memuat `temp.js` atau `test-supabase.js` sebelum penghapusan dilakukan.
4. THE System SHALL memperbarui `.gitignore` untuk menyertakan pola `temp*.js` dan `test-*.js` guna mencegah penambahan file serupa di masa mendatang.

---

### Requirement 15 — Optimasi Performa

**User Story:** Sebagai pengguna dengan koneksi internet terbatas, saya ingin halaman KANUM memuat dengan cepat, sehingga pengalaman belajar tidak terganggu oleh waktu tunggu yang lama.

#### Acceptance Criteria

1. THE System SHALL menambahkan atribut `loading="lazy"` pada semua elemen `<img>` yang berada di luar viewport awal di seluruh halaman Student Dashboard dan Admin Panel.
2. THE System SHALL menambahkan atribut `rel="preconnect"` dan `rel="dns-prefetch"` untuk domain CDN yang digunakan (`cdn.jsdelivr.net`, `fonts.googleapis.com`, `fonts.gstatic.com`) di bagian `<head>` pada semua halaman.
3. THE System SHALL menyediakan satu file `tailwind.config.js` yang lengkap di root proyek beserta instruksi di `README.md` untuk melakukan build Tailwind CSS lokal menggunakan Tailwind CLI, menghasilkan file CSS yang diminifikasi, sebagai alternatif penggunaan CDN Tailwind.
4. WHERE sebuah halaman memuat Supabase JS dari CDN (`cdn.jsdelivr.net/npm/@supabase/supabase-js@2`), THE System SHALL memastikan tag script tersebut menggunakan versi yang di-pin (contoh: `@2.49.1`) dan bukan floating range, untuk menjamin konsistensi pemuatan di semua sesi.
5. THE System SHALL mengurangi jumlah request font Google Fonts yang terpisah pada halaman-halaman yang saat ini memuat dua atau tiga URL font berbeda (seperti `Daftar.html`) menjadi satu URL tunggal yang menggabungkan semua font yang dibutuhkan.
6. WHEN sebuah gambar di `Asset/Images/` direferensikan di lebih dari satu halaman, THE System SHALL menggunakan path yang konsisten (relatif atau absolut) pada semua referensi tersebut untuk mencegah pemuatan duplikat oleh browser.

# 05 — IMPLEMENTATION ROADMAP

> **⚠️ STATUS: CATATAN PERENCANAAN.** Roadmap ini disusun sebelum implementasi;
> sebagian phase sudah selesai dan sebagian arah teknis berubah (Supabase, bukan
> MySQL/Prisma). Untuk status nyata, lihat rute di `app/` dan `README.md`.

**Produk:** Platform Pembelajaran Matematika Berbasis Etnomatematika Ammatoa Kajang
**Versi Dokumen:** 1.0 (MVP Planning)
**Total Phase:** 13

Roadmap ini bersifat **sekuensial berdasarkan dependency** — setiap phase mengasumsikan phase sebelumnya telah selesai dan stabil, sesuai rekomendasi pada 01-ARCHITECTURE.md Bagian 27 untuk menghindari paralelisasi fitur yang saling bergantung.

---

## PHASE 1 — PROJECT PLANNING

**Objective**
Menetapkan fondasi keputusan sebelum satu baris kode pun ditulis, memastikan seluruh tim (atau developer solo) memiliki acuan yang sama.

**Deliverables**
- Dokumen 01-ARCHITECTURE.md, 02-DATABASE.md, 03-UI-UX.md, 04-DEVELOPMENT-RULES.md disetujui final.
- Daftar akun/layanan pihak ketiga yang dibutuhkan (Vercel, Supabase, penyedia MySQL) teridentifikasi.

**Checklist**
- [ ] Review dan finalisasi keempat dokumen acuan.
- [ ] Konfirmasi cakupan MVP tidak berubah dari proposal penelitian.
- [ ] Registrasi akun Vercel, Supabase.
- [ ] Siapkan repository Git kosong.

**Dependencies**
Tidak ada (titik awal proyek).

**Acceptance Criteria**
Seluruh dokumen perencanaan telah dibaca dan disepakati sebagai acuan tunggal pengembangan.

**Priority**
Kritis (blocking seluruh phase berikutnya).

**Estimated Difficulty**
Rendah (bersifat administratif/dokumentasi).

**Risk**
Jika dilewati/terburu-buru, risiko scope creep tinggi di phase-phase berikutnya.

**Recommendation**
Jangan mulai coding sebelum phase ini benar-benar tuntas — investasi waktu di sini akan menghemat waktu jauh lebih besar di phase implementasi.

---

## PHASE 2 — PROJECT SETUP

**Objective**
Menyiapkan fondasi teknis proyek: struktur folder, konfigurasi tooling, koneksi database awal.

**Deliverables**
- Proyek Next.js 15 terinisialisasi dengan TypeScript, TailwindCSS, Shadcn UI.
- Struktur folder sesuai 01-ARCHITECTURE.md Bagian 11.
- Koneksi Prisma ke MySQL (lokal via Laragon) berhasil.
- Environment variable dasar (`.env`) terkonfigurasi dan tidak ter-commit ke Git.

**Checklist**
- [ ] Inisialisasi proyek Next.js 15 + TypeScript.
- [ ] Instalasi & konfigurasi TailwindCSS + Shadcn UI.
- [ ] Instalasi Framer Motion.
- [ ] Setup Prisma + koneksi MySQL lokal (Laragon).
- [ ] Setup struktur folder awal (`app/`, `modules/`, `components/`, `lib/`).
- [ ] Setup `.gitignore` mencakup `.env`, `node_modules`.
- [ ] Setup koneksi Supabase Storage (kredensial dasar).
- [ ] Konfigurasi tema Tailwind sesuai token desain (03-UI-UX.md Bagian 1).

**Dependencies**
Phase 1 selesai.

**Acceptance Criteria**
Aplikasi Next.js kosong dapat dijalankan lokal (`dev server`), terkoneksi ke database MySQL tanpa error.

**Priority**
Kritis.

**Estimated Difficulty**
Rendah–Sedang.

**Risk**
Kesalahan konfigurasi awal (mis. struktur folder tidak konsisten) akan menular ke seluruh phase berikutnya.

**Recommendation**
Commit konfigurasi dasar ini sebagai baseline sebelum menambah fitur apa pun, agar mudah dijadikan titik rollback jika diperlukan.

---

## PHASE 3 — AUTHENTICATION

**Objective**
Membangun sistem login yang aman dan membedakan akses berdasarkan role (Guru/Siswa) sesuai 01-ARCHITECTURE.md Bagian 7.3.

**Deliverables**
- Model `User`, `Guru`, `Siswa` pada skema Prisma (sesuai 02-DATABASE.md).
- Integrasi Auth.js dengan credential provider.
- Middleware proteksi route berdasarkan role.
- Halaman Login sesuai spesifikasi 03-UI-UX.md Bagian 3.

**Checklist**
- [ ] Migrasi skema `User`, `Guru`, `Siswa`.
- [ ] Konfigurasi Auth.js (credential provider, session strategy).
- [ ] Implementasi hashing password.
- [ ] Implementasi halaman Login (UI + Server Action).
- [ ] Middleware pemisah route `(guru)` dan `(siswa)`.
- [ ] Redirect otomatis pasca-login sesuai role.
- [ ] Uji percobaan login gagal (kredensial salah) menampilkan pesan sesuai spesifikasi UX.

**Dependencies**
Phase 2 selesai.

**Acceptance Criteria**
Guru dan Siswa dapat login dengan akun masing-masing dan diarahkan ke area yang sesuai; akses silang antar-role ke route yang tidak sesuai ditolak sistem.

**Priority**
Kritis (seluruh fitur lain bergantung pada identitas & otorisasi).

**Estimated Difficulty**
Sedang.

**Risk**
Celah otorisasi di phase ini akan berdampak ke seluruh sistem — kesalahan di sini paling mahal untuk diperbaiki belakangan.

**Recommendation**
Terapkan pengujian otorisasi (mencoba akses route yang salah) secara eksplisit sebelum melanjutkan ke phase berikutnya, jangan diasumsikan aman tanpa diuji.

---

## PHASE 4 — LANDING PAGE

**Objective**
Membangun halaman publik pertama yang dilihat pengguna, sesuai spesifikasi 03-UI-UX.md Bagian 2.

**Deliverables**
- Halaman Landing lengkap (hero, fitur, highlight budaya, footer).
- Navigasi ke halaman Login.

**Checklist**
- [ ] Implementasi Hero Section.
- [ ] Implementasi Feature Highlight Section.
- [ ] Implementasi Culture Highlight Section (placeholder konten awal).
- [ ] Implementasi Footer.
- [ ] Uji responsif di 3 breakpoint (mobile/tablet/desktop).
- [ ] Optimasi gambar hero (Next.js Image).

**Dependencies**
Phase 2 selesai (tidak wajib menunggu Phase 3, dapat dikerjakan paralel oleh anggota tim berbeda jika ada).

**Acceptance Criteria**
Landing page dapat diakses publik tanpa login, tampil sesuai wireframe dan responsif di seluruh breakpoint.

**Priority**
Sedang (penting untuk kesan pertama, namun tidak blocking fungsi inti pembelajaran).

**Estimated Difficulty**
Rendah–Sedang.

**Risk**
Risiko rendah secara teknis; risiko utama adalah kualitas visual tidak mencapai standar "modern EdTech" yang diharapkan.

**Recommendation**
Gunakan konten placeholder budaya sementara jika materi budaya final belum tersedia, agar phase ini tidak blocking terhadap phase lain.

---

## PHASE 5 — DASHBOARD GURU

**Objective**
Membangun ruang kerja utama Guru sesuai 03-UI-UX.md Bagian 4.

**Deliverables**
- Layout Sidebar + Topbar untuk seluruh halaman Guru.
- Dashboard dengan stat card, chart ringkasan, activity feed.

**Checklist**
- [ ] Implementasi Sidebar Navigation (guru).
- [ ] Implementasi Topbar (profil singkat, logout).
- [ ] Implementasi Stat Card (4x) dengan data dummy awal.
- [ ] Implementasi Chart Widget ringkasan progres kelas.
- [ ] Implementasi Activity Feed.
- [ ] Hubungkan Stat Card ke data riil (setelah modul terkait tersedia — dapat bertahap).
- [ ] Uji responsif (sidebar collapse di tablet/mobile).

**Dependencies**
Phase 3 selesai (butuh sesi login Guru).

**Acceptance Criteria**
Guru yang login melihat Dashboard dengan navigasi lengkap ke seluruh modul (walau modul lain belum berisi data riil di tahap ini).

**Priority**
Tinggi.

**Estimated Difficulty**
Sedang.

**Risk**
Karena banyak stat bergantung pada modul lain yang belum ada di phase ini, ada risiko dashboard "kosong" sementara — perlu direncanakan data dummy/placeholder yang jujur (bukan data palsu permanen).

**Recommendation**
Bangun shell layout (sidebar+topbar) terlebih dahulu di phase ini karena akan dipakai ulang oleh seluruh modul Guru selanjutnya (Materi, Budaya, Soal, dst.).

---

## PHASE 6 — DASHBOARD SISWA

**Objective**
Membangun ruang belajar utama Siswa sesuai 03-UI-UX.md Bagian 5.

**Deliverables**
- Layout Sidebar/Bottom Navigation untuk seluruh halaman Siswa.
- Dashboard dengan hero "Lanjutkan Belajar", progress stat, elemen gamifikasi ringan (streak).

**Checklist**
- [ ] Implementasi Sidebar/Bottom Navigation (siswa).
- [ ] Implementasi Continue Learning Card.
- [ ] Implementasi Progress Stat Cards (dummy awal).
- [ ] Implementasi Streak Indicator sederhana.
- [ ] Implementasi Content Carousel budaya (placeholder).
- [ ] Uji nada bahasa & visual sesuai prinsip "encouraging" (bukan menghakimi).
- [ ] Uji responsif, khususnya prioritas mobile (bottom navigation).

**Dependencies**
Phase 3 selesai.

**Acceptance Criteria**
Siswa yang login melihat Dashboard yang ramah dan mengarahkan jelas ke aktivitas belajar berikutnya.

**Priority**
Tinggi.

**Estimated Difficulty**
Sedang.

**Risk**
Elemen gamifikasi jika berlebihan dapat mengalihkan fokus dari tujuan pembelajaran inti — perlu dijaga tetap "ringan" sesuai spesifikasi awal.

**Recommendation**
Bangun shell layout siswa di phase ini sebagai fondasi untuk Materi, Budaya, Latihan, Quiz, Hasil di phase-phase selanjutnya.

---

## PHASE 7 — MATERI

**Objective**
Membangun modul pengelolaan (Guru) dan konsumsi (Siswa) materi pembelajaran, sesuai 03-UI-UX.md Bagian 6.

**Deliverables**
- CRUD Materi & TopikMateri untuk Guru.
- Halaman daftar & detail Materi untuk Siswa (reading view).
- Pelacakan progres baca dasar (menandai topik selesai).

**Checklist**
- [ ] Migrasi skema `Materi`, `TopikMateri`.
- [ ] Implementasi CRUD Materi (Guru): create, edit, hapus (soft delete), lihat daftar.
- [ ] Implementasi halaman daftar Materi (Siswa) dengan progress indicator.
- [ ] Implementasi Reading View detail Materi.
- [ ] Implementasi mekanisme "tandai selesai" per topik.
- [ ] Hubungkan progres baca ke modul Progress (dasar, disempurnakan di Phase 10).
- [ ] Uji upload gambar materi ke Supabase Storage.
- [ ] Uji responsif reading view di seluruh breakpoint.

**Dependencies**
Phase 5 (shell Guru) dan Phase 6 (shell Siswa) selesai.

**Acceptance Criteria**
Guru dapat membuat/mengedit materi lengkap dengan topik; Siswa dapat membaca materi tersebut dan progres tercatat.

**Priority**
Kritis (materi adalah konten inti penelitian).

**Estimated Difficulty**
Sedang–Tinggi.

**Risk**
Struktur konten materi yang kompleks (bab-topik-referensi budaya) berisiko under-designed jika terburu-buru — pastikan mengacu ketat ke skema 02-DATABASE.md.

**Recommendation**
Selesaikan modul ini sebelum Budaya (Phase 8) karena relasi `RelasiMateriBudaya` membutuhkan entitas Materi sudah ada terlebih dahulu.

---

## PHASE 8 — BUDAYA

**Objective**
Membangun modul eksplorasi budaya Ammatoa Kajang, elemen paling khas dari penelitian ini, sesuai 03-UI-UX.md Bagian 7.

**Deliverables**
- CRUD Konten Budaya untuk Guru.
- Halaman galeri & detail Budaya untuk Siswa.
- Relasi Materi–Budaya berfungsi (tautan dua arah).

**Checklist**
- [ ] Migrasi skema `KontenBudaya`, `RelasiMateriBudaya`.
- [ ] Implementasi CRUD Konten Budaya (Guru).
- [ ] Implementasi halaman Galeri Budaya (Siswa).
- [ ] Implementasi halaman Detail Budaya dengan Math Connection Callout.
- [ ] Implementasi tautan dua arah Materi ↔ Budaya.
- [ ] Uji kualitas visual/naratif sesuai catatan desain (prioritas visual tertinggi, 03-UI-UX.md Bagian 7).
- [ ] Uji upload multi-gambar galeri ke Supabase Storage.

**Dependencies**
Phase 7 selesai (butuh entitas Materi untuk relasi).

**Acceptance Criteria**
Siswa dapat menjelajahi konten budaya dan melihat koneksinya ke materi matematika terkait secara jelas.

**Priority**
Kritis (ini adalah nilai unik utama penelitian — pembeda dari EdTech generik).

**Estimated Difficulty**
Sedang.

**Risk**
Jika kualitas konten/visual budaya tidak mendapat perhatian khusus, nilai riset utama platform ini melemah.

**Recommendation**
Libatkan validasi konten budaya dari sumber yang kredibel (mis. dosen pembimbing/narasumber adat) sebelum konten final dipublikasikan ke siswa.

---

## PHASE 9 — QUIZ

**Objective**
Membangun bank soal serta engine pengerjaan Latihan, Quiz, Pretest, dan Posttest — modul paling kompleks secara logika bisnis, sesuai 03-UI-UX.md Bagian 8–9.

**Deliverables**
- CRUD Bank Soal & Soal untuk Guru.
- Engine pengerjaan Latihan (bebas ulang, feedback instan).
- Engine pengerjaan Quiz per topik.
- Engine pengerjaan Pretest/Posttest (satu kali, terkunci).
- Halaman Hasil pasca-pengerjaan.

**Checklist**
- [ ] Migrasi skema `BankSoal`, `Soal`, `OpsiJawaban`, `SesiPengerjaan`, `JawabanSiswa`, `HasilBelajar`.
- [ ] Implementasi CRUD Bank Soal & Soal (Guru).
- [ ] Implementasi halaman Instruksi sesi (sebelum mulai).
- [ ] Implementasi UI pengerjaan soal (single-question focus).
- [ ] Implementasi ScoreService (perhitungan skor otomatis).
- [ ] Implementasi QuizService dengan validasi status "sekali kerjakan" untuk Pretest/Posttest (unique constraint + validasi service, sesuai 02-DATABASE.md Bagian 13).
- [ ] Implementasi modal konfirmasi submit (khusus Pretest/Posttest, penekanan ireversibilitas).
- [ ] Implementasi halaman Hasil dengan nada suportif (03-UI-UX.md Bagian 10).
- [ ] Implementasi penyimpanan progresif jawaban untuk mitigasi koneksi terputus (NFR Reliability).
- [ ] Uji end-to-end: Latihan bisa diulang, Pretest/Posttest tidak bisa diulang.

**Dependencies**
Phase 7 selesai (soal terkait ke topik materi).

**Acceptance Criteria**
Siswa dapat mengerjakan Latihan berulang kali; Siswa hanya dapat mengerjakan Pretest/Posttest tepat satu kali dan tervalidasi berlapis (DB + aplikasi); Guru dapat mengelola seluruh bank soal.

**Priority**
Kritis (modul dengan risiko tertinggi terhadap validitas data penelitian).

**Estimated Difficulty**
Tinggi.

**Risk**
Modul paling berisiko secara teknis maupun ilmiah — kegagalan penguncian status pretest/posttest secara langsung merusak validitas data riset.

**Recommendation**
Alokasikan waktu pengujian paling besar untuk modul ini dibanding modul lain; uji skenario tepi (edge case) seperti percobaan submit ganda, refresh di tengah sesi, dan koneksi terputus mendadak.

---

## PHASE 10 — PROGRESS

**Objective**
Menyempurnakan pelacakan progres belajar siswa secara menyeluruh (materi, latihan, quiz) menjadi satu sistem progres terpadu, sesuai FR-S08 dan FR-G06.

**Deliverables**
- Model `ProgressBelajar` terisi otomatis dari aktivitas Materi, Latihan, Quiz.
- Halaman/komponen progres di Dashboard Siswa dan Dashboard Guru menampilkan data riil (menggantikan dummy dari Phase 5–6).

**Checklist**
- [ ] Migrasi/penyempurnaan skema `ProgressBelajar`.
- [ ] Implementasi update otomatis progres saat topik materi selesai dibaca.
- [ ] Implementasi update otomatis progres saat latihan/quiz diselesaikan.
- [ ] Hubungkan Stat Card Dashboard Siswa ke data progres riil.
- [ ] Hubungkan Stat Card Dashboard Guru (progres kelas agregat) ke data riil.
- [ ] Uji konsistensi data progres setelah berbagai skenario aktivitas.

**Dependencies**
Phase 7 dan Phase 9 selesai (progres berasal dari aktivitas kedua modul tersebut).

**Acceptance Criteria**
Dashboard Guru dan Siswa menampilkan data progres yang akurat dan real-time berdasarkan aktivitas riil, bukan lagi data dummy.

**Priority**
Tinggi.

**Estimated Difficulty**
Sedang.

**Risk**
Jika logic update progres tersebar di banyak tempat (bukan terpusat), risiko data tidak konsisten tinggi.

**Recommendation**
Terapkan pola terpusat (mis. satu fungsi `updateProgress()` dipanggil dari seluruh titik pemicu) sesuai prinsip Domain Layer pada 01-ARCHITECTURE.md, bukan diimplementasikan berulang di setiap modul secara independen.

---

## PHASE 11 — REPORT

**Objective**
Membangun modul Laporan bagi Guru untuk kebutuhan analisis penelitian, sesuai 03-UI-UX.md Bagian 11.

**Deliverables**
- Halaman Laporan dengan filter, chart perbandingan Pretest–Posttest, tabel detail per siswa.
- Modul Kelola Siswa dasar (jika belum lengkap dari phase sebelumnya) untuk mendukung filter per kelas.

**Checklist**
- [ ] Migrasi skema `Kelas`, `AnggotaKelas` (jika belum ada dari phase awal).
- [ ] Implementasi CRUD dasar Kelola Siswa (Guru) — FR-G05.
- [ ] Implementasi Filter (Kelas, Periode) pada halaman Laporan.
- [ ] Implementasi Chart perbandingan Pretest vs Posttest.
- [ ] Implementasi Tabel Detail per siswa (sortable).
- [ ] Implementasi halaman detail individual siswa (riwayat lengkap sesi).
- [ ] Uji akurasi data laporan terhadap data mentah `SesiPengerjaan`/`HasilBelajar`.

**Dependencies**
Phase 9 (data sesi/hasil) dan Phase 10 (data progres) selesai.

**Acceptance Criteria**
Guru dapat menganalisis efektivitas pembelajaran melalui perbandingan pretest-posttest secara akurat dan mudah dibaca — data ini menjadi output kunci untuk laporan penelitian PKM-RSH.

**Priority**
Kritis (output langsung untuk kebutuhan penelitian).

**Estimated Difficulty**
Sedang–Tinggi.

**Risk**
Kesalahan agregasi data pada modul ini berdampak langsung pada validitas kesimpulan penelitian.

**Recommendation**
Validasi silang manual (spot-check) antara data yang ditampilkan Laporan dengan data mentah di database sebelum modul ini dianggap selesai — jangan hanya mengandalkan pengujian visual UI.

---

## PHASE 12 — TESTING

**Objective**
Pengujian menyeluruh seluruh sistem sebelum digunakan untuk pengumpulan data penelitian riil.

**Deliverables**
- Hasil pengujian fungsional seluruh fitur (FR-G01–FR-G10, FR-S01–FR-S11, FR-SYS01–FR-SYS04).
- Hasil pengujian non-fungsional (performa, responsivitas, aksesibilitas dasar).
- Daftar bug teridentifikasi dan diperbaiki.

**Checklist**
- [ ] Uji fungsional seluruh fitur Guru sesuai Bagian 5.1 (01-ARCHITECTURE.md).
- [ ] Uji fungsional seluruh fitur Siswa sesuai Bagian 5.2.
- [ ] Uji skenario kritis: pretest/posttest tidak dapat diulang dalam berbagai kondisi (refresh, multi-tab, koneksi terputus).
- [ ] Uji responsif seluruh halaman di 3 breakpoint (sesuai 03-UI-UX.md per halaman).
- [ ] Uji aksesibilitas dasar (kontras, navigasi keyboard, alt text).
- [ ] Uji performa dasar (waktu muat halaman utama).
- [ ] Uji Code Review Checklist (04-DEVELOPMENT-RULES.md Bagian 25) di seluruh modul.
- [ ] User Acceptance Testing bersama sampel guru/siswa riil (jika memungkinkan dalam skala penelitian).

**Dependencies**
Phase 3–11 selesai seluruhnya.

**Acceptance Criteria**
Tidak ada bug kritis (data hilang, otorisasi bocor, pretest/posttest dapat diulang) yang tersisa; sistem stabil digunakan untuk pengumpulan data riset.

**Priority**
Kritis (gerbang terakhir sebelum data penelitian riil dikumpulkan).

**Estimated Difficulty**
Sedang–Tinggi (bergantung banyaknya temuan).

**Risk**
Waktu pengujian sering diremehkan/dipangkas karena tekanan deadline — risiko ini harus diwaspadai secara eksplisit oleh tim/peneliti.

**Recommendation**
Jangan mengompres phase ini demi mengejar tenggat; masalah yang lolos di sini akan langsung mencemari data penelitian yang sudah terkumpul dan sulit diperbaiki mundur.

---

## PHASE 13 — DEPLOYMENT

**Objective**
Merilis aplikasi ke lingkungan produksi dan memastikan siap digunakan untuk pengumpulan data penelitian riil di sekolah target.

**Deliverables**
- Aplikasi live di Vercel dengan domain yang dapat diakses.
- Database produksi (MySQL terkelola) dan Supabase Storage produksi terhubung dan terpisah dari data development.
- Dokumentasi singkat cara penggunaan untuk Guru (onboarding minimal).

**Checklist**
- [ ] Setup environment variable produksi (terpisah dari development).
- [ ] Setup database MySQL produksi (hosted terkelola).
- [ ] Jalankan migrasi skema ke database produksi.
- [ ] Deploy aplikasi ke Vercel.
- [ ] Uji ulang alur kritis (login, pretest, materi, budaya) langsung di lingkungan produksi.
- [ ] Seed data awal produksi: akun Guru riil, materi/budaya/soal final (bukan data dummy development).
- [ ] Siapkan panduan singkat onboarding Guru (cara login, cara mengelola kelas).
- [ ] Pantau performa & error selama periode awal penggunaan riil.

**Dependencies**
Phase 12 selesai dengan hasil pengujian memuaskan.

**Acceptance Criteria**
Guru dan Siswa target penelitian dapat mengakses dan menggunakan platform secara stabil di lingkungan produksi untuk keperluan pengumpulan data riset.

**Priority**
Kritis (tujuan akhir seluruh roadmap).

**Estimated Difficulty**
Sedang.

**Risk**
Perbedaan kondisi lingkungan development vs produksi (mis. koneksi database, environment variable) berpotensi memunculkan bug baru yang tidak terlihat sebelumnya.

**Recommendation**
Lakukan deployment percobaan (staging) beberapa hari sebelum penggunaan riil dimulai, agar ada waktu memperbaiki isu spesifik lingkungan produksi tanpa tekanan waktu penelitian yang sedang berjalan.

# 01 — SOFTWARE ARCHITECTURE DOCUMENT

> **⚠️ STATUS: DOKUMEN PERENCANAAN MVP (v1.0) — SEBAGIAN SUDAH TIDAK BERLAKU.**
> Implementasi yang berjalan memakai **Next.js 15 (App Router) + Supabase
> (Postgres/Auth/Storage) + Tailwind**, bukan MySQL 8 + Prisma seperti tertulis
> di bawah ini. Sumber kebenaran terkini: [`README.md`](../README.md),
> [`Supabase/README.md`](../Supabase/README.md), dan kode di `app/` + `lib/`.
> Dokumen ini dipertahankan sebagai catatan sejarah perencanaan.

**Produk:** Platform Pembelajaran Matematika Berbasis Etnomatematika Ammatoa Kajang
**Kode Internal:** EtnoMath Platform (working title)
**Versi Dokumen:** 1.0 (MVP Planning)
**Status:** Draft untuk Acuan Pengembangan Tim
**Tipe Dokumen:** Software Architecture Document (SAD)

---

## DAFTAR ISI

1. Executive Summary
2. Vision
3. Product Overview
4. Business Objectives
5. Functional Requirements
6. Non Functional Requirements
7. Software Architecture
8. System Architecture
9. Application Architecture
10. Technology Stack
11. Folder Structure
12. Software Pattern
13. Design Pattern
14. Module Breakdown
15. Feature Breakdown
16. Navigation Flow
17. User Flow
18. System Flow
19. Component Hierarchy
20. Data Flow
21. Scalability Strategy
22. Security Strategy
23. Performance Strategy
24. Deployment Strategy
25. Future Development
26. Risks
27. Recommendation

---

## 1. EXECUTIVE SUMMARY

Dokumen ini menetapkan arsitektur perangkat lunak untuk sebuah platform EdTech yang dikembangkan dari proposal penelitian PKM-RSH, dengan fokus pada peningkatan kemampuan numerasi siswa SMP melalui Tes Kemampuan Akademik (TKA) yang diperkaya oleh muatan etnomatematika dari teknik menenun kain Tope' Le'Leng masyarakat adat Ammatoa Kajang.

Platform ini dirancang bukan sebagai website informasi statis, melainkan sebagai **sistem pembelajaran digital (Learning Management System yang disederhanakan/simplified LMS)** yang benar-benar dipakai dalam proses belajar-mengajar oleh dua aktor: **Guru** (yang berperan ganda sebagai pengelola konten dan administrator sistem) dan **Siswa** (sebagai pembelajar mandiri).

Keputusan arsitektur pada dokumen ini secara konsisten diarahkan untuk:

- Mendukung validitas hasil penelitian (data pretest/posttest yang bersih dan terlacak).
- Memberikan pengalaman pengguna setara produk EdTech modern (Ruangguru, Khan Academy, Duolingo) tanpa over-engineering.
- Menjaga MVP tetap ramping, stabil, dan dapat dikembangkan lebih lanjut menjadi produk startup di masa depan.

Pendekatan arsitektur menggunakan **Monolithic Modular Architecture** di atas Next.js App Router (fullstack dalam satu codebase), dengan justifikasi lengkap dijelaskan pada Bagian 7–9.

---

## 2. VISION

> "Menjadikan warisan budaya Ammatoa Kajang sebagai jembatan kontekstual yang membuat matematika terasa dekat, bermakna, dan mudah dipahami oleh siswa SMP — disajikan dalam pengalaman digital sekelas produk EdTech nasional."

Visi ini diterjemahkan menjadi tiga pilar produk:

| Pilar | Deskripsi |
|---|---|
| **Pedagogis** | Etnomatematika sebagai konteks nyata untuk numerasi, bukan sekadar hiasan budaya. |
| **Pengalaman** | UI/UX modern, cepat, dan tidak terasa seperti "tugas akhir/skripsi". |
| **Ilmiah** | Sistem menghasilkan data terukur (skor pretest, posttest, progress) yang valid untuk kebutuhan penelitian. |

---

## 3. PRODUCT OVERVIEW

Platform adalah aplikasi web (bukan native mobile app pada MVP) yang terdiri dari dua ruang kerja utama:

- **Ruang Guru** — pusat kendali penuh: mengelola materi, budaya, bank soal, siswa, dan laporan hasil belajar.
- **Ruang Siswa** — ruang belajar mandiri: membaca materi, mengeksplorasi budaya, mengerjakan latihan/quiz, memantau progres pribadi.

Tidak ada role Admin terpisah — Guru **adalah** administrator sistem. Ini bukan penyederhanaan sembarangan, melainkan keputusan arsitektur yang disengaja (lihat Bagian 7.3) karena konteks penggunaan riil: satu guru mengelola satu atau beberapa kelas dalam skala penelitian/kelas, bukan skala institusi multi-sekolah.

Platform difokuskan secara ketat pada domain: **Matematika SMP, Numerasi, TKA, dan Etnomatematika Ammatoa Kajang.** Semua fitur yang tidak berkontribusi langsung pada domain ini didorong ke bagian Future Development (Bagian 25).

---

## 4. BUSINESS OBJECTIVES

| # | Objective | Metrik Keberhasilan |
|---|---|---|
| 1 | Menyediakan media pembelajaran yang mengintegrasikan etnomatematika ke numerasi SMP | Materi & budaya termuat lengkap dan dapat diakses siswa |
| 2 | Mengukur efektivitas pembelajaran melalui pretest–posttest | Data skor pretest/posttest tercatat akurat per siswa |
| 3 | Memberi guru kendali penuh atas kelas tanpa kompleksitas admin terpisah | Guru dapat mengelola seluruh siklus belajar dari satu dashboard |
| 4 | Menyajikan pengalaman EdTech modern agar penelitian mendapat validitas persepsi tinggi | UI/UX setara benchmark (Ruangguru, Khan Academy, Duolingo) |
| 5 | Membangun fondasi teknis yang dapat berkembang menjadi produk startup | Arsitektur modular, tidak perlu rewrite besar saat scale-up |

---

## 5. FUNCTIONAL REQUIREMENTS

### 5.1 Guru (Administrator Fungsional)

| Kode | Requirement |
|---|---|
| FR-G01 | Guru dapat login/logout dengan aman |
| FR-G02 | Guru dapat mengelola (create/read/update/delete) materi pembelajaran |
| FR-G03 | Guru dapat mengelola konten eksplorasi budaya Ammatoa Kajang |
| FR-G04 | Guru dapat mengelola bank soal (latihan, quiz, pretest, posttest) |
| FR-G05 | Guru dapat mengelola akun siswa (tambah, edit, nonaktifkan) |
| FR-G06 | Guru dapat melihat progres belajar tiap siswa secara individual |
| FR-G07 | Guru dapat melihat hasil belajar agregat (kelas) dan per siswa |
| FR-G08 | Guru dapat mengekspor/melihat laporan hasil pretest–posttest |
| FR-G09 | Guru dapat mengatur profil dan pengaturan akun |
| FR-G10 | Guru dapat melihat dashboard ringkasan aktivitas kelas |

### 5.2 Siswa

| Kode | Requirement |
|---|---|
| FR-S01 | Siswa dapat login/logout dengan aman |
| FR-S02 | Siswa dapat membaca materi pembelajaran terstruktur |
| FR-S03 | Siswa dapat mengeksplorasi konten budaya Ammatoa Kajang |
| FR-S04 | Siswa dapat mengerjakan latihan soal dengan umpan balik |
| FR-S05 | Siswa dapat mengerjakan pretest (satu kali, terkunci setelah submit) |
| FR-S06 | Siswa dapat mengerjakan posttest (satu kali, terkunci setelah submit) |
| FR-S07 | Siswa dapat mengerjakan quiz per topik/modul |
| FR-S08 | Siswa dapat melihat progres belajar pribadi |
| FR-S09 | Siswa dapat melihat riwayat nilai/hasil belajar |
| FR-S10 | Siswa dapat mengatur profil akun |
| FR-S11 | Siswa melihat dashboard ringkasan aktivitas belajar & gamifikasi ringan (streak, lencana sederhana) |

### 5.3 Sistem (Cross-cutting)

| Kode | Requirement |
|---|---|
| FR-SYS01 | Sistem mencatat waktu pengerjaan dan jawaban setiap sesi latihan/quiz/test |
| FR-SYS02 | Sistem menghitung skor otomatis untuk soal objektif (pilihan ganda) |
| FR-SYS03 | Sistem mencegah siswa mengulang pretest/posttest yang sudah disubmit |
| FR-SYS04 | Sistem menampilkan landing page publik sebagai pintu masuk sebelum login |

---

## 6. NON FUNCTIONAL REQUIREMENTS

| Kategori | Requirement | Justifikasi |
|---|---|---|
| **Usability** | Navigasi maksimal 3 klik ke fitur inti | Siswa SMP butuh alur sederhana, minim friksi kognitif |
| **Performance** | First Contentful Paint < 2 detik pada koneksi 4G rata-rata Indonesia | Banyak sekolah dengan koneksi terbatas |
| **Reliability** | Data pretest/posttest tidak boleh hilang meski koneksi terputus di tengah pengerjaan | Kredibilitas data penelitian bergantung padanya |
| **Availability** | Target uptime 99% selama masa penelitian aktif | Cukup untuk skala penelitian, bukan skala enterprise |
| **Accessibility** | Kontras warna WCAG AA minimum, ukuran font dapat dibaca di perangkat sekolah | Siswa memakai berbagai perangkat, termasuk yang lawas |
| **Responsiveness** | Wajib responsif di desktop, tablet, dan mobile | Siswa Indonesia mayoritas mengakses lewat perangkat mobile/shared device |
| **Security** | Autentikasi aman, otorisasi berbasis role, proteksi terhadap akses silang data siswa | Data nilai siswa adalah data sensitif akademik |
| **Maintainability** | Kode modular, konsisten, terdokumentasi | Tim kecil/solo developer harus bisa maintain jangka panjang |
| **Portability** | Tidak terkunci penuh pada satu vendor cloud di luar yang telah dipilih | Memudahkan migrasi saat scale-up |
| **Scalability (soft)** | Arsitektur mendukung penambahan sekolah/kelas tanpa restrukturisasi total | Mendukung visi jangka panjang menjadi produk startup |

---

## 7. SOFTWARE ARCHITECTURE

### 7.1 Gaya Arsitektur: Monolithic Modular (Modular Monolith)

**Keputusan:** Menggunakan satu aplikasi Next.js fullstack (frontend + backend API dalam satu codebase) yang disusun secara modular per domain fitur, bukan microservices.

**Justifikasi:**
- Skala pengguna MVP adalah satu/sejumlah kecil kelas SMP — bukan trafik enterprise. Microservices akan menjadi over-engineering yang bertentangan langsung dengan instruksi proyek ("jangan overengineering").
- Tim pengembang kemungkinan solo/kecil (berdasarkan konteks proyek), sehingga kompleksitas operasional microservices (banyak deployment, orkestrasi, observability terdistribusi) tidak sebanding manfaatnya.
- Next.js App Router memungkinkan kolokasi API Route Handler dan UI di satu repository, mempercepat iterasi.
- Modular monolith tetap menjaga batas-batas domain (materi, budaya, soal, progress) secara jelas di level folder/module, sehingga **migrasi ke microservices di masa depan tetap dimungkinkan** tanpa rewrite total (lihat Bagian 25).

### 7.2 Pola Fullstack: Server-first Rendering dengan Selective Interactivity

Next.js App Router dengan React Server Components (RSC) sebagai default, dan Client Components hanya pada titik yang benar-benar butuh interaktivitas (form, quiz timer, animasi).

**Justifikasi:**
- Server Components mengurangi JavaScript yang dikirim ke browser → penting untuk NFR performa di koneksi terbatas.
- Data sensitif (soal, kunci jawaban) dapat diambil dan diproses di server tanpa terekspos ke client bundle.

### 7.3 Keputusan: Guru sebagai Administrator (Tanpa Role Admin Terpisah)

**Justifikasi:**
- Business rule eksplisit menyatakan hanya dua role: Guru dan Siswa.
- Menghindari kompleksitas RBAC (Role-Based Access Control) berlapis yang tidak dibutuhkan pada skala ini.
- Secara arsitektur, tabel/entitas otorisasi tetap dirancang generik (role-based, bukan hardcoded "guru only") sehingga penambahan role admin di masa depan (misalnya saat multi-sekolah) tidak memerlukan migrasi struktural besar — cukup penambahan nilai role baru dan aturan otorisasi baru.

### 7.4 Arsitektur Data: Single Relational Database (MySQL)

**Justifikasi:**
- Data bersifat sangat relasional (siswa ↔ kelas, siswa ↔ hasil test, materi ↔ budaya ↔ soal).
- Kebutuhan integritas data tinggi karena dipakai untuk penelitian ilmiah — relational database dengan constraint tegas lebih aman dibanding NoSQL untuk kasus ini.
- MySQL 8 mendukung fitur modern (window functions, CTE, JSON column jika dibutuhkan fleksibilitas parsial) tanpa mengorbankan integritas relasional.

---

## 8. SYSTEM ARCHITECTURE

Diagram tingkat tinggi (ASCII):

```
                            ┌───────────────────────────┐
                            │        BROWSER (Client)     │
                            │  Guru UI  |  Siswa UI        │
                            └──────────────┬───────────────┘
                                           │ HTTPS
                                           ▼
                    ┌───────────────────────────────────────────┐
                    │             VERCEL EDGE / CDN                │
                    │  Static Assets, Edge Caching, SSR Runtime   │
                    └──────────────────────┬────────────────────┘
                                           ▼
                    ┌───────────────────────────────────────────┐
                    │        NEXT.JS APPLICATION (App Router)      │
                    │  ┌─────────────┐   ┌───────────────────┐   │
                    │  │  UI Layer    │   │  API Route Handlers│   │
                    │  │ (RSC + CSR)  │   │  (Server Actions)  │   │
                    │  └─────────────┘   └─────────┬──────────┘   │
                    │  ┌───────────────────────────▼───────────┐ │
                    │  │        Service / Business Logic Layer   │ │
                    │  └───────────────────────────┬───────────┘ │
                    │  ┌───────────────────────────▼───────────┐ │
                    │  │            Prisma ORM Layer              │ │
                    │  └───────────────────────────┬───────────┘ │
                    └──────────────────────────────┼─────────────┘
                                           ▼                     ▼
                          ┌─────────────────────┐   ┌─────────────────────┐
                          │     MySQL 8 (DB)      │   │  Supabase Storage    │
                          │  Data Relasional        │   │  (Media: gambar,     │
                          │                          │   │  ilustrasi budaya)   │
                          └─────────────────────┘   └─────────────────────┘

                    ┌───────────────────────────────────────────┐
                    │        Auth.js (Authentication Layer)       │
                    │   Session Management + Credential Provider   │
                    └───────────────────────────────────────────┘
```

### 8.1 Komponen Sistem

| Komponen | Peran |
|---|---|
| Vercel Edge/CDN | Distribusi aset statis, caching, menjalankan SSR |
| Next.js Application | Inti aplikasi: UI, routing, API, logika bisnis |
| Service Layer | Enkapsulasi aturan bisnis (skoring, validasi pretest/posttest) |
| Prisma ORM | Abstraksi akses database, migrasi skema |
| MySQL 8 | Penyimpanan data relasional utama |
| Supabase Storage | Penyimpanan media (gambar materi, ilustrasi budaya, avatar) |
| Auth.js | Manajemen autentikasi & sesi |

---

## 9. APPLICATION ARCHITECTURE

Aplikasi dibagi menjadi lapisan-lapisan berikut (Layered Architecture di dalam Modular Monolith):

```
┌────────────────────────────────────────────┐
│  Presentation Layer                          │
│  - Pages (App Router segments)               │
│  - Layouts, Templates                        │
│  - UI Components (Shadcn + Custom)           │
├────────────────────────────────────────────┤
│  Application Layer                           │
│  - Server Actions                            │
│  - API Route Handlers                        │
│  - Form validation orchestration             │
├────────────────────────────────────────────┤
│  Domain / Business Logic Layer               │
│  - Services (mis. QuizService, ScoreService) │
│  - Domain rules (pretest lock, scoring)      │
├────────────────────────────────────────────┤
│  Data Access Layer                           │
│  - Prisma Client                             │
│  - Repository-style query modules            │
├────────────────────────────────────────────┤
│  Infrastructure Layer                        │
│  - MySQL, Supabase Storage, Auth.js provider │
└────────────────────────────────────────────┘
```

**Justifikasi pemisahan lapisan:**
- Business logic (misalnya "pretest hanya boleh dikerjakan sekali") tidak boleh tersebar di UI Component — harus terpusat di Domain Layer agar konsisten dan mudah diuji.
- Data Access Layer dipisah dari Domain Layer agar penggantian ORM/database di masa depan tidak merusak logika bisnis.

---

## 10. TECHNOLOGY STACK

| Layer | Teknologi | Justifikasi Singkat |
|---|---|---|
| Frontend Framework | Next.js 15 (App Router) | Fullstack, SSR/RSC, ekosistem matang |
| UI Library | React 19 | Standar industri, kompatibel penuh dengan Next.js 15 |
| Bahasa | TypeScript | Type-safety mengurangi bug pada tim kecil |
| Styling | TailwindCSS | Konsistensi desain cepat, minim CSS custom bertumpuk |
| Component System | Shadcn UI | Komponen accessible, mudah dikustomisasi, bukan library berat |
| Animasi | Framer Motion | Micro-interaction halus tanpa membangun animation engine sendiri |
| Backend | Next.js App Router (Route Handlers + Server Actions) | Tidak perlu backend terpisah untuk skala MVP |
| Database | MySQL 8 | Relasional kuat, cocok data akademik terstruktur |
| ORM | Prisma ORM | Type-safe query, migrasi terkelola, cocok TypeScript |
| Autentikasi | Auth.js | Solusi auth matang untuk Next.js, mendukung credential-based login |
| Storage Media | Supabase Storage | Storage terkelola untuk gambar tanpa membangun file server sendiri |
| Local Dev | Laragon | Lingkungan lokal MySQL/PHP-adjacent yang familiar untuk dev Indonesia |
| Version Control | Git | Standar industri |
| Deployment | Vercel | Native untuk Next.js, CI/CD otomatis, edge network |

---

## 11. FOLDER STRUCTURE

Struktur folder tingkat tinggi (konsep, bukan implementasi kode):

```
project-root/
│
├── app/                        # App Router: routing & page composition
│   ├── (public)/                # Route group: landing, auth
│   │   ├── landing/
│   │   └── login/
│   ├── (guru)/                  # Route group: seluruh ruang Guru
│   │   ├── dashboard/
│   │   ├── materi/
│   │   ├── budaya/
│   │   ├── soal/
│   │   ├── siswa/
│   │   ├── laporan/
│   │   └── settings/
│   ├── (siswa)/                 # Route group: seluruh ruang Siswa
│   │   ├── dashboard/
│   │   ├── materi/
│   │   ├── budaya/
│   │   ├── latihan/
│   │   ├── quiz/
│   │   ├── hasil/
│   │   └── settings/
│   └── api/                     # Route Handlers (jika diperlukan di luar Server Actions)
│
├── modules/                     # Domain modules (business logic per domain)
│   ├── auth/
│   ├── materi/
│   ├── budaya/
│   ├── soal/
│   ├── quiz/
│   ├── progress/
│   └── laporan/
│
├── components/                  # UI components reusable lintas modul
│   ├── ui/                      # Shadcn base components
│   ├── shared/                  # Komponen gabungan (card, table, dsb.)
│   └── layout/                  # Navbar, sidebar, shell layout
│
├── lib/                         # Utilities, konfigurasi, helper
│   ├── db/                      # Prisma client instance
│   ├── auth/                    # Konfigurasi Auth.js
│   ├── validation/              # Skema validasi (mis. Zod)
│   └── utils/
│
├── prisma/                      # Skema & migrasi database (konsep)
│
├── public/                      # Aset statis
│
└── types/                       # Definisi tipe global TypeScript
```

**Justifikasi:**
- Pemisahan `app/` (routing/presentasi) dari `modules/` (logika domain) menjaga business logic tidak tercampur dengan concern routing — memudahkan testing dan refactor.
- Route groups `(guru)` dan `(siswa)` memberi batas jelas antar ruang kerja sekaligus mempermudah penerapan middleware otorisasi per grup.

---

## 12. SOFTWARE PATTERN

| Pattern | Penerapan |
|---|---|
| **Layered Architecture** | Pemisahan presentation, application, domain, data access (Bagian 9) |
| **Modular Monolith** | Domain terisolasi dalam folder `modules/`, satu deployable unit |
| **Server-first Rendering** | RSC sebagai default, client component hanya saat perlu |
| **Feature-based Organization** | Struktur folder mengikuti fitur/domain, bukan tipe file semata |

---

## 13. DESIGN PATTERN

| Pattern | Penerapan Konseptual |
|---|---|
| **Repository Pattern (ringan)** | Modul data-access membungkus query Prisma agar Domain Layer tidak bergantung langsung pada detail ORM |
| **Service Pattern** | Logika bisnis (skoring, validasi status pretest) dienkapsulasi dalam service per domain (mis. `QuizService`, `ScoreService`) |
| **Strategy Pattern (konseptual)** | Untuk tipe soal berbeda (pilihan ganda vs esai) — logika penilaian dapat diperluas tanpa mengubah struktur inti |
| **Factory Pattern (konseptual)** | Pembuatan sesi test (pretest/posttest/quiz) melalui satu titik konstruksi yang konsisten, mencegah state tidak valid |
| **Observer-like Pattern (via events ringan)** | Saat siswa menyelesaikan aktivitas, sistem memperbarui progress secara konsisten tanpa logic tersebar di banyak tempat |

---

## 14. MODULE BREAKDOWN

| Modul | Tanggung Jawab |
|---|---|
| **Auth Module** | Login, sesi, proteksi rute berdasarkan role |
| **Materi Module** | CRUD materi pembelajaran, struktur bab/topik |
| **Budaya Module** | CRUD & penyajian konten eksplorasi budaya Ammatoa Kajang |
| **Soal Module** | Bank soal: latihan, quiz, pretest, posttest |
| **Quiz Engine Module** | Alur pengerjaan test: mulai sesi, submit jawaban, kunci setelah selesai |
| **Scoring Module** | Perhitungan skor otomatis, penyimpanan hasil |
| **Progress Module** | Pelacakan progres belajar siswa per materi/topik |
| **Laporan Module** | Agregasi data untuk kebutuhan Guru & penelitian |
| **User Management Module** | Guru mengelola akun siswa |
| **Profile/Settings Module** | Pengelolaan profil & preferensi akun |

---

## 15. FEATURE BREAKDOWN

| Fitur | Guru | Siswa |
|---|:---:|:---:|
| Landing Page | ✓ (akses publik) | ✓ (akses publik) |
| Login | ✓ | ✓ |
| Dashboard | ✓ (ringkasan kelas) | ✓ (ringkasan belajar pribadi) |
| Materi | Kelola (CRUD) | Baca |
| Budaya | Kelola (CRUD) | Eksplorasi |
| Latihan | Kelola soal | Kerjakan |
| Quiz | Kelola soal | Kerjakan |
| Pretest/Posttest | Kelola & lihat hasil | Kerjakan (satu kali) |
| Progress | Lihat progres siswa | Lihat progres pribadi |
| Nilai/Hasil | Lihat seluruh siswa | Lihat pribadi |
| Laporan | Lihat & telaah data agregat | — |
| Kelola Siswa | ✓ | — |
| Profil/Settings | ✓ | ✓ |

---

## 16. NAVIGATION FLOW

```
[Landing Page]
      │
      ▼
  [Login] ───────────────┐
      │                    │
      ▼                    ▼
[Role = Guru]        [Role = Siswa]
      │                    │
      ▼                    ▼
[Dashboard Guru]     [Dashboard Siswa]
   ├─ Materi            ├─ Materi
   ├─ Budaya            ├─ Budaya
   ├─ Soal               ├─ Latihan
   ├─ Siswa              ├─ Quiz
   ├─ Laporan            ├─ Hasil/Progress
   └─ Settings           └─ Settings
```

---

## 17. USER FLOW

### 17.1 User Flow — Siswa Mengerjakan Pretest

```
Login → Dashboard Siswa → Notifikasi/Menu Pretest tersedia
   → Halaman Instruksi Pretest → Mulai Sesi
   → Mengerjakan soal (linear, tidak bisa mundur jika dikunci)
   → Submit → Sistem menghitung skor
   → Halaman Hasil (skor ditampilkan/opsional disembunyikan sesuai kebutuhan riset)
   → Status pretest terkunci permanen
```

### 17.2 User Flow — Siswa Belajar Materi + Budaya

```
Dashboard Siswa → Menu Materi → Pilih Topik
   → Baca Materi (dengan elemen etnomatematika terintegrasi)
   → Tautan ke Eksplorasi Budaya terkait
   → Kembali ke Materi → Kerjakan Latihan terkait topik
   → Progress ter-update otomatis
```

### 17.3 User Flow — Guru Mengelola Soal & Melihat Laporan

```
Login → Dashboard Guru → Menu Soal
   → Tambah/Edit/Hapus soal (kategori: latihan/quiz/pretest/posttest)
   → Menu Laporan → Filter per siswa/kelas/periode
   → Lihat perbandingan skor pretest vs posttest
   → (Opsional) Ekspor/lihat detail per siswa
```

---

## 18. SYSTEM FLOW

Alur sistem saat siswa submit jawaban (contoh representatif):

```
[Client: Submit Jawaban]
        │
        ▼
[Server Action: submitAnswer()]
        │
        ▼
[Validasi Sesi & Status Otorisasi] ── gagal ──▶ [Response 401/403]
        │ lolos
        ▼
[Domain Layer: QuizService.validateSubmission()]
        │
        ▼
[Cek status sesi: belum submit sebelumnya?] ── sudah ──▶ [Tolak, kembalikan status terkunci]
        │ belum
        ▼
[ScoreService.calculateScore()]
        │
        ▼
[Data Access Layer: simpan jawaban & skor via Prisma]
        │
        ▼
[ProgressModule: update progres siswa]
        │
        ▼
[Response: hasil ke Client]
```

---

## 19. COMPONENT HIERARCHY

Contoh hierarki komponen untuk halaman Quiz (konseptual, bukan kode):

```
QuizPage (Server Component)
 ├─ QuizHeader (info topik, timer jika ada)
 ├─ QuizProgressBar
 ├─ QuizQuestionCard (Client Component - interaktif)
 │    ├─ QuestionText
 │    ├─ AnswerOptionList
 │    │    └─ AnswerOptionItem (multiple instances)
 │    └─ NavigationButtons (Prev/Next/Submit)
 └─ QuizSubmitModal (Client Component - konfirmasi submit)
```

Prinsip hierarki:
- Komponen struktural/statis tetap Server Component.
- Hanya komponen dengan state interaktif (pilihan jawaban, timer, modal) menjadi Client Component.
- Komponen reusable (Card, Button, Modal, Table) berasal dari `components/ui` (Shadcn) dan `components/shared`.

---

## 20. DATA FLOW

```
[UI Component]
     │  (user action)
     ▼
[Server Action / API Route]
     │  (memanggil)
     ▼
[Service Layer - Business Rules]
     │  (memanggil)
     ▼
[Data Access Layer - Prisma Query Module]
     │  (query/mutasi)
     ▼
[MySQL Database]
     │  (hasil)
     ▼
[Data Access Layer] → [Service Layer] → [Server Action] → [UI Component (re-render)]
```

Untuk media (gambar materi/budaya):

```
[Guru Upload Gambar] → [Server Action] → [Supabase Storage API]
     → [URL/Reference disimpan di MySQL via Prisma]
     → [Siswa mengakses] → [URL diambil dari DB] → [Gambar dimuat langsung dari Supabase CDN]
```

---

## 21. SCALABILITY STRATEGY

| Aspek | Strategi | Justifikasi |
|---|---|---|
| Database | Indexing terencana sejak awal (lihat 02-DATABASE.md) | Menghindari refactor index darurat saat data bertambah |
| Modularitas Kode | Domain terisolasi di `modules/` | Modul dapat diekstrak jadi service terpisah di masa depan tanpa rewrite total |
| Caching | Next.js data cache & static rendering untuk konten yang jarang berubah (materi, budaya) | Mengurangi beban database berulang |
| Media | Supabase Storage + CDN | Tidak membebani server aplikasi untuk serving file statis besar |
| Horizontal Scaling | Vercel serverless functions otomatis scale sesuai trafik | Tidak perlu manajemen server manual di tahap MVP |
| Multi-tenant readiness (future) | Skema database dirancang dengan relasi guru–kelas–siswa yang jelas | Memudahkan penambahan konsep "sekolah/kelas" tanpa migrasi struktural besar |

---

## 22. SECURITY STRATEGY

| Area | Strategi |
|---|---|
| Autentikasi | Auth.js dengan credential provider, password di-hash (bcrypt/argon2 melalui Auth.js) |
| Otorisasi | Middleware berbasis role memisahkan akses route `(guru)` dan `(siswa)` |
| Session | Session token aman (HTTP-only cookie), expiry wajar |
| Data Sensitif | Kunci jawaban soal tidak pernah dikirim ke client sebelum submit |
| Validasi Input | Validasi server-side wajib di setiap Server Action/API (tidak percaya validasi client saja) |
| Proteksi Data Silang | Siswa tidak dapat mengakses data siswa lain (object-level authorization di setiap query) |
| Transport | HTTPS wajib (default di Vercel) |
| Rate Limiting (dasar) | Pembatasan percobaan login untuk mencegah brute force |

---

## 23. PERFORMANCE STRATEGY

| Area | Strategi |
|---|---|
| Rendering | Maksimalkan Server Components, minimalkan JS bundle client |
| Gambar | Next.js Image Optimization untuk aset dari Supabase Storage |
| Data Fetching | Fetch data sedekat mungkin dengan komponen yang membutuhkan (co-location), hindari waterfall berlebihan |
| Database Query | Query terindeks, hindari N+1 lewat Prisma `include`/`select` yang tepat |
| Static Content | Materi & budaya yang jarang berubah menggunakan static/ISR rendering |
| Animasi | Framer Motion digunakan selektif agar tidak membebani perangkat low-end |

---

## 24. DEPLOYMENT STRATEGY

```
[Local Development - Laragon + MySQL]
        │  git push
        ▼
[GitHub Repository]
        │  auto trigger
        ▼
[Vercel CI/CD Pipeline]
        │  build & test
        ▼
[Vercel Production Deployment]
        │
        ▼
[Edge Network Global] ──▶ [End User: Guru & Siswa]

Database: MySQL 8 (hosted terpisah, mis. PlanetScale/managed MySQL)
Storage: Supabase Storage (terkelola, terpisah dari compute)
```

**Justifikasi:**
- Pemisahan compute (Vercel), database, dan storage mengikuti prinsip separation of concerns infrastruktur, memudahkan scaling/migrasi independen tiap layer.
- Environment lokal (Laragon) dipilih karena familiar bagi developer Indonesia dan mendukung MySQL secara native untuk development sebelum deploy.

---

## 25. FUTURE DEVELOPMENT

Fitur/keputusan berikut **sengaja tidak dimasukkan ke MVP** agar sesuai lingkup penelitian, namun arsitektur saat ini dirancang agar hal berikut dapat ditambahkan tanpa rewrite besar:

- Role Admin terpisah untuk skala multi-sekolah.
- Multi-tenant (banyak sekolah dalam satu instance).
- Leaderboard/gamifikasi lanjutan (badge kompleks, level, reward).
- Notifikasi real-time (mis. pengingat tugas).
- Mode offline/PWA untuk daerah dengan koneksi terbatas.
- Integrasi AI tutor/chat pembelajaran.
- Export laporan ke PDF/Excel otomatis.
- Native mobile app.
- Analitik pembelajaran lanjutan (learning analytics dashboard).

---

## 26. RISKS

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Over-scoping fitur di luar MVP | Timeline penelitian molor | Disiplin mengacu pada Bagian 5 (Functional Requirements) dan Roadmap |
| Koneksi internet sekolah terbatas | Pengalaman belajar terganggu | Optimasi performa (Bagian 23), rendering ringan |
| Data pretest/posttest korup/hilang | Validitas penelitian terganggu | Transaksi database atomik, validasi status sesi ketat |
| Solo/small-team development | Bottleneck pengembangan | Arsitektur modular memudahkan pengerjaan bertahap per modul |
| Perubahan kebutuhan riset di tengah jalan | Rework signifikan | Domain layer terpisah dari UI agar perubahan aturan lebih terlokalisasi |

---

## 27. RECOMMENDATION

1. Mulai pengembangan dari modul **Auth** dan **Materi/Budaya** (fondasi konten) sebelum modul **Quiz Engine** yang lebih kompleks.
2. Kunci skema database (02-DATABASE.md) sejak awal — perubahan skema di tengah penelitian berisiko tinggi terhadap integritas data.
3. Terapkan **Development Rules** (04-DEVELOPMENT-RULES.md) sejak commit pertama, bukan setelah kode menumpuk.
4. Ikuti **Roadmap** (05-ROADMAP.md) secara berurutan; hindari paralelisasi fitur yang saling bergantung.
5. Validasi UI/UX dengan calon pengguna (guru/siswa SMP riil) sedini mungkin sebelum seluruh modul selesai, untuk menghindari revisi besar di akhir.

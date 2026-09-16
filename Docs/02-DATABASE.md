# 02 — DATABASE PLANNING DOCUMENT

> **⚠️ STATUS: DOKUMEN PERENCANAAN MVP (v1.0) — SUDAH TIDAK BERLAKU.**
> Database produksi adalah **Supabase Postgres** (bukan MySQL 8), diakses lewat
> `@supabase/supabase-js` (bukan Prisma). Skema, RLS, dan fungsi yang benar-benar
> dipakai ada di `Supabase/*.sql`; ringkasannya di [`Supabase/README.md`](../Supabase/README.md).

**Produk:** Platform Pembelajaran Matematika Berbasis Etnomatematika Ammatoa Kajang
**Versi Dokumen:** 1.0 (MVP Planning)
**Database Engine:** MySQL 8
**ORM:** Prisma ORM (konsep perencanaan saja, tanpa syntax)

---

## DAFTAR ISI

1. Executive Summary
2. Database Overview
3. Entity List
4. Entity Relationship Diagram (ERD)
5. Cardinality
6. Table Relationship
7. Primary Key Strategy
8. Foreign Key Strategy
9. Unique Constraint
10. Index Planning
11. Data Type Recommendation
12. Normalization
13. Business Rule
14. Data Integrity
15. Audit Strategy
16. Soft Delete Strategy
17. Future Expansion
18. Prisma Planning (Concept Only)

---

## 1. EXECUTIVE SUMMARY

Dokumen ini merancang struktur basis data relasional untuk mendukung seluruh alur pembelajaran: manajemen materi, eksplorasi budaya, bank soal, sesi pengerjaan (latihan/quiz/pretest/posttest), progres belajar, dan pelaporan hasil. Desain mengutamakan **integritas data** karena hasil pretest–posttest akan menjadi data ilmiah dalam penelitian PKM-RSH — kesalahan struktural pada level ini berdampak langsung pada validitas hasil riset.

Skema dirancang dalam bentuk normalisasi (3NF) dengan pengecualian terukur pada tabel yang membutuhkan fleksibilitas (mis. jawaban siswa berbasis JSON untuk tipe soal yang bervariasi), disertai strategi indexing, audit, dan soft delete yang konsisten.

---

## 2. DATABASE OVERVIEW

| Aspek | Keterangan |
|---|---|
| Jenis Database | Relational (MySQL 8) |
| Pendekatan Desain | Normalized (3NF) dengan pengecualian terukur |
| Jumlah Domain Entitas Utama | 8 domain: User, Materi, Budaya, Soal, Sesi Pengerjaan, Jawaban, Progress, Laporan/Audit |
| Strategi ID | Menggunakan `CUID`/`UUID` sebagai Primary Key (lihat Bagian 7) |
| Strategi Hapus Data | Soft Delete pada entitas yang berpengaruh terhadap riwayat (lihat Bagian 16) |
| Strategi Audit | Timestamp wajib + log aktivitas penting (lihat Bagian 15) |

---

## 3. ENTITY LIST

| # | Entitas | Deskripsi |
|---|---|---|
| 1 | **User** | Akun dasar (menyimpan kredensial & role) |
| 2 | **Guru** | Profil tambahan khusus role guru |
| 3 | **Siswa** | Profil tambahan khusus role siswa |
| 4 | **Kelas** | Pengelompokan siswa oleh guru (opsional tapi direkomendasikan untuk penelitian) |
| 5 | **AnggotaKelas** | Tabel relasi siswa–kelas (many-to-many secara struktural, walau umumnya 1 siswa : 1 kelas aktif) |
| 6 | **Materi** | Konten pembelajaran matematika |
| 7 | **TopikMateri** | Sub-bagian/bab dari materi (struktur hierarkis) |
| 8 | **KontenBudaya** | Konten eksplorasi budaya Ammatoa Kajang |
| 9 | **RelasiMateriBudaya** | Penghubung materi dengan konten budaya terkait (many-to-many) |
| 10 | **BankSoal** | Induk soal (latihan/quiz/pretest/posttest) |
| 11 | **Soal** | Butir soal individual |
| 12 | **OpsiJawaban** | Pilihan jawaban untuk soal pilihan ganda |
| 13 | **SesiPengerjaan** | Instance satu kali pengerjaan (quiz/pretest/posttest/latihan) oleh siswa |
| 14 | **JawabanSiswa** | Jawaban siswa per soal dalam satu sesi |
| 15 | **ProgressBelajar** | Rekaman progres siswa per topik/materi |
| 16 | **HasilBelajar** | Ringkasan skor akhir per sesi (denormalized untuk kebutuhan laporan cepat) |
| 17 | **AuditLog** | Pencatatan aktivitas penting sistem |
| 18 | **Media** | Referensi file (gambar) yang tersimpan di Supabase Storage |

---

## 4. ENTITY RELATIONSHIP DIAGRAM (ERD)

```
┌─────────┐        ┌───────────┐         ┌────────────┐
│  User    │1─────1│   Guru     │         │   Siswa     │1
└────┬────┘        └─────┬─────┘         └──────┬──────┘
     │1                    │1                       │
     │                     │ mengelola               │ N
     │                     ▼                          ▼
     │              ┌────────────┐          ┌──────────────┐
     │              │   Kelas     │1────────N│ AnggotaKelas  │
     │              └────────────┘          └──────────────┘
     │
     │        ┌────────────┐        ┌────────────────┐
     │  Guru 1│  Materi     │1──────N│  TopikMateri     │
     │  mengelola └────┬───────┘        └────────┬─────────┘
     │                  │ N                          │
     │                  │                            │
     │                  ▼ M                          │
     │           ┌──────────────────┐                 │
     │           │RelasiMateriBudaya │                 │
     │           └─────────┬────────┘                 │
     │                     │ M                           │
     │                     ▼                              │
     │              ┌───────────────┐                    │
     │              │ KontenBudaya   │                    │
     │              └───────────────┘                    │
     │                                                     │
     │              ┌────────────┐        ┌───────────┐  │
     │        Guru 1│  BankSoal   │1──────N│   Soal     │◀─┘
     │        mengelola └───┬────┘        └─────┬─────┘
     │                       │                       │ 1
     │                       │                       │
     │                       │                       ▼ N
     │                       │              ┌────────────────┐
     │                       │              │ OpsiJawaban     │
     │                       │              └────────────────┘
     │                       │
     │                       ▼ N
     │              ┌──────────────────┐
     │       Siswa 1│ SesiPengerjaan     │1──────N┌────────────────┐
     │              └────────┬─────────┘         │ JawabanSiswa    │
     │                       │ 1                    └────────────────┘
     │                       ▼ 1
     │              ┌────────────────┐
     │              │ HasilBelajar    │
     │              └────────────────┘
     │
     │              ┌────────────────────┐
     │       Siswa 1│ ProgressBelajar      │N (per topik)
     │              └────────────────────┘
     │
     │              ┌────────────┐
     │        User 1│ AuditLog    │N
     │              └────────────┘
     │
     │              ┌────────────┐
     │        User 1│  Media      │N (uploader)
     │              └────────────┘
```

---

## 5. CARDINALITY

| Relasi | Kardinalitas | Catatan |
|---|---|---|
| User – Guru | 1 : 1 | Satu user dengan role GURU memiliki tepat satu profil Guru |
| User – Siswa | 1 : 1 | Satu user dengan role SISWA memiliki tepat satu profil Siswa |
| Guru – Kelas | 1 : N | Satu guru dapat mengelola banyak kelas |
| Kelas – AnggotaKelas – Siswa | N : M (via AnggotaKelas) | Struktur fleksibel; MVP umumnya 1 siswa aktif di 1 kelas |
| Guru – Materi | 1 : N | Guru mengelola banyak materi |
| Materi – TopikMateri | 1 : N | Satu materi punya banyak topik/sub-bab |
| Materi – KontenBudaya | N : M (via RelasiMateriBudaya) | Satu materi bisa terhubung banyak konten budaya, dan sebaliknya |
| Guru – BankSoal | 1 : N | Guru mengelola banyak bank soal |
| BankSoal – Soal | 1 : N | Satu bank soal berisi banyak butir soal |
| Soal – OpsiJawaban | 1 : N | Satu soal pilihan ganda punya banyak opsi |
| Siswa – SesiPengerjaan | 1 : N | Siswa dapat memiliki banyak sesi (berbeda jenis/waktu) |
| SesiPengerjaan – JawabanSiswa | 1 : N | Satu sesi berisi banyak jawaban (satu per soal) |
| SesiPengerjaan – HasilBelajar | 1 : 1 | Setiap sesi menghasilkan tepat satu ringkasan hasil |
| Siswa – ProgressBelajar | 1 : N | Progres dicatat per topik per siswa |
| User – AuditLog | 1 : N | Satu user dapat memicu banyak log aktivitas |

---

## 6. TABLE RELATIONSHIP

| Tabel Induk | Tabel Anak | Jenis FK | Perilaku saat Induk Dihapus |
|---|---|---|---|
| User | Guru / Siswa | FK wajib | Restrict (tidak boleh hapus user yang masih punya profil aktif tanpa soft delete) |
| Guru | Kelas | FK wajib | Restrict |
| Kelas | AnggotaKelas | FK wajib | Cascade (jika kelas dihapus, keanggotaan ikut soft-deleted) |
| Guru | Materi, BankSoal, KontenBudaya | FK wajib | Restrict |
| Materi | TopikMateri | FK wajib | Cascade (soft delete mengikuti induk) |
| Materi ↔ KontenBudaya | RelasiMateriBudaya | FK wajib keduanya | Cascade pada baris relasi saja |
| BankSoal | Soal | FK wajib | Restrict/Cascade tergantung kebijakan (direkomendasikan Restrict agar histori soal tidak hilang) |
| Soal | OpsiJawaban | FK wajib | Cascade |
| Siswa | SesiPengerjaan | FK wajib | Restrict (data riset tidak boleh terhapus otomatis) |
| SesiPengerjaan | JawabanSiswa | FK wajib | Cascade (mengikuti siklus hidup sesi) |
| SesiPengerjaan | HasilBelajar | FK wajib | Cascade |
| Siswa | ProgressBelajar | FK wajib | Restrict |

---

## 7. PRIMARY KEY STRATEGY

**Keputusan:** Seluruh tabel menggunakan **CUID (Collision-resistant Unique Identifier)** sebagai Primary Key, bukan auto-increment integer.

**Justifikasi:**
- ID tidak mudah ditebak/dienumerasi — penting karena URL/route bisa memuat ID sesi pengerjaan siswa (mencegah IDOR — Insecure Direct Object Reference).
- Memudahkan migrasi/merge data di masa depan (mis. jika beberapa instance data digabung saat scale-up multi-sekolah) tanpa konflik ID.
- Kompatibel native dengan Prisma tanpa konfigurasi tambahan yang rumit.

---

## 8. FOREIGN KEY STRATEGY

- Setiap FK **wajib diindeks** (lihat Bagian 10) karena akan sering menjadi filter query (mis. "semua sesi milik siswa X").
- FK ke entitas riwayat penelitian (SesiPengerjaan, JawabanSiswa, HasilBelajar) menggunakan **Restrict** on delete — mencegah penghapusan tidak sengaja terhadap data ilmiah.
- FK ke entitas struktural pendukung (OpsiJawaban, TopikMateri) menggunakan **Cascade** karena tidak bermakna berdiri sendiri tanpa induknya.

---

## 9. UNIQUE CONSTRAINT

| Tabel | Kolom | Alasan |
|---|---|---|
| User | `email` | Email sebagai identitas login unik |
| User | `username` (jika dipakai selain email) | Mencegah duplikasi akun |
| AnggotaKelas | kombinasi (`kelasId`, `siswaId`) | Mencegah siswa terdaftar ganda di kelas yang sama |
| RelasiMateriBudaya | kombinasi (`materiId`, `budayaId`) | Mencegah relasi duplikat |
| SesiPengerjaan | kombinasi (`siswaId`, `bankSoalId`, `tipe`) khusus untuk tipe `PRETEST`/`POSTTEST` | **Kritis:** menegakkan aturan bisnis "pretest/posttest hanya sekali" langsung di level database, bukan hanya di aplikasi |
| JawabanSiswa | kombinasi (`sesiId`, `soalId`) | Satu jawaban per soal per sesi, mencegah duplikasi entri |
| ProgressBelajar | kombinasi (`siswaId`, `topikId`) | Satu baris progres per siswa per topik |

---

## 10. INDEX PLANNING

| Tabel | Kolom Index | Tipe | Alasan |
|---|---|---|---|
| User | `email` | Unique Index | Lookup saat login |
| Siswa | `kelasAktifId` (jika didenormalisasi) | Index biasa | Query "semua siswa di kelas X" oleh guru |
| Materi | `guruId`, `status` | Composite Index | Filter materi aktif milik guru tertentu |
| TopikMateri | `materiId`, `urutan` | Composite Index | Query terurut topik dalam satu materi |
| KontenBudaya | `guruId`, `status` | Composite Index | Sama seperti materi |
| Soal | `bankSoalId`, `tipe` | Composite Index | Filter soal berdasarkan bank & tipe |
| SesiPengerjaan | `siswaId`, `tipe`, `status` | Composite Index | Query dashboard siswa & validasi status pretest/posttest |
| SesiPengerjaan | `bankSoalId` | Index biasa | Laporan agregat guru per bank soal |
| JawabanSiswa | `sesiId` | Index biasa | Ambil seluruh jawaban dalam satu sesi |
| ProgressBelajar | `siswaId`, `topikId` | Composite Index (juga Unique) | Lookup progres cepat |
| HasilBelajar | `siswaId`, `sesiId` | Composite Index | Laporan per siswa |
| AuditLog | `userId`, `createdAt` | Composite Index | Query log terurut waktu per user |

**Prinsip umum:** Semua kolom yang menjadi filter (`WHERE`), join (`JOIN`), atau pengurutan (`ORDER BY`) pada query yang sering dijalankan (dashboard, laporan) wajib dipertimbangkan untuk indexing sejak desain awal — bukan ditambahkan reaktif setelah terjadi masalah performa.

---

## 11. DATA TYPE RECOMMENDATION

| Jenis Data | Tipe MySQL Direkomendasikan | Catatan |
|---|---|---|
| ID (Primary/Foreign Key) | `VARCHAR(30)` (menampung CUID) | Konsisten di seluruh tabel |
| Nama, Judul | `VARCHAR(255)` | Cukup untuk judul materi/soal |
| Konten panjang (isi materi, deskripsi budaya) | `TEXT` / `LONGTEXT` | Materi bisa berisi narasi panjang + referensi HTML terformat |
| Email | `VARCHAR(255)` | Standar RFC email length |
| Password Hash | `VARCHAR(255)` | Menampung hash bcrypt/argon2 |
| Role/Enum (role, status, tipe soal) | `ENUM` | Menegakkan validitas nilai langsung di level DB |
| Skor | `DECIMAL(5,2)` | Presisi nilai desimal (mis. 87.50), hindari `FLOAT` untuk data akademik agar tidak ada rounding error |
| Waktu mulai/selesai sesi | `DATETIME` | Presisi ke detik untuk analisis durasi pengerjaan |
| Durasi pengerjaan | `INT` (dalam detik) | Memudahkan agregasi/analisis statistik |
| Urutan (topik, opsi jawaban) | `TINYINT` / `INT` | Menentukan urutan tampil |
| Jawaban siswa (fleksibel per tipe soal) | `JSON` | Menampung struktur jawaban berbeda (pilihan ganda vs esai) tanpa banyak tabel terpisah |
| Flag boolean (is_active, is_locked) | `BOOLEAN` (`TINYINT(1)`) | Standar |
| Timestamp audit | `DATETIME` (`createdAt`, `updatedAt`, `deletedAt`) | Wajib di semua tabel utama |

---

## 12. NORMALIZATION

**Tingkat normalisasi utama: 3NF (Third Normal Form)**

Penerapan:
- **1NF:** Semua kolom bersifat atomik (tidak ada multi-value dalam satu kolom, kecuali kolom JSON yang secara sengaja didesain sebagai dokumen terstruktur untuk fleksibilitas jawaban — dijelaskan sebagai pengecualian terukur).
- **2NF:** Seluruh atribut non-key bergantung penuh pada Primary Key (bukan sebagian, relevan pada tabel relasi seperti `AnggotaKelas`, `RelasiMateriBudaya`).
- **3NF:** Tidak ada atribut non-key yang bergantung pada atribut non-key lain (mis. nama guru tidak disimpan berulang di tabel Materi — cukup `guruId` sebagai referensi).

**Pengecualian terukur (Controlled Denormalization):**
- Tabel `HasilBelajar` bersifat semi-denormalized (menyimpan skor akhir yang sebenarnya bisa dihitung ulang dari `JawabanSiswa`) — **sengaja** dilakukan untuk mempercepat query laporan/dashboard tanpa perlu agregasi berat setiap kali diakses. Ini adalah trade-off standar dalam desain data warehouse ringan untuk kebutuhan pelaporan.

---

## 13. BUSINESS RULE

Aturan bisnis yang harus ditegakkan di level database (melalui constraint) **dan** di level aplikasi (melalui domain service) sebagai lapisan ganda:

| Aturan | Penegakan di DB | Penegakan di Aplikasi |
|---|---|---|
| Pretest/Posttest hanya bisa dikerjakan satu kali per siswa | Unique constraint pada `(siswaId, bankSoalId, tipe)` | Validasi status sebelum membuat sesi baru |
| Siswa tidak dapat mengakses jawaban siswa lain | — (tidak feasible di level DB) | Object-level authorization di setiap query |
| Guru hanya dapat mengelola materi/soal miliknya sendiri | FK `guruId` wajib ada | Filter query berdasarkan `guruId` dari sesi login |
| Soal dalam bank soal tidak dapat dihapus jika sudah ada jawaban siswa terkait | FK Restrict dari `JawabanSiswa` ke `Soal` | Validasi tambahan sebelum aksi hapus, tampilkan peringatan |
| Skor harus berada dalam rentang valid (0–100) | `CHECK constraint` (MySQL 8 mendukung) | Validasi input di server sebelum simpan |

---

## 14. DATA INTEGRITY

- **Referential Integrity:** Seluruh relasi antar tabel menggunakan FK constraint eksplisit — tidak ada relasi "implisit" tanpa constraint di level database.
- **Domain Integrity:** Kolom bertipe status/role/tipe menggunakan `ENUM` agar nilai tidak valid tidak dapat tersimpan.
- **Entity Integrity:** Setiap tabel memiliki Primary Key non-null, tidak ada tabel tanpa identitas unik.
- **Transactional Integrity:** Operasi yang melibatkan lebih dari satu tabel dalam satu aksi bisnis (mis. submit sesi → simpan jawaban → hitung skor → update progress) **wajib dibungkus dalam satu database transaction**, agar tidak terjadi data setengah tersimpan jika terjadi kegagalan di tengah proses.

---

## 15. AUDIT STRATEGY

Setiap tabel utama memiliki kolom audit standar:

| Kolom | Tipe | Fungsi |
|---|---|---|
| `createdAt` | DATETIME | Waktu data dibuat |
| `updatedAt` | DATETIME | Waktu data terakhir diubah |
| `createdBy` (opsional pada tabel yang dikelola Guru) | FK ke User | Melacak siapa yang membuat data |

Selain itu, tabel **AuditLog** terpisah mencatat aktivitas penting yang bersifat sensitif atau berdampak pada integritas riset, contoh:

- Guru mengubah/menghapus soal yang sudah pernah dikerjakan siswa.
- Guru menonaktifkan akun siswa.
- Perubahan status sesi pengerjaan secara manual (jika ada fitur override oleh guru).

**Justifikasi:** Untuk kebutuhan penelitian, jejak audit membantu menjelaskan anomali data (mis. jika skor berubah, dapat ditelusuri apakah karena perubahan soal oleh guru atau kesalahan sistem).

---

## 16. SOFT DELETE STRATEGY

**Keputusan:** Menggunakan kolom `deletedAt` (nullable DATETIME) pada tabel yang datanya berpotensi memengaruhi riwayat/riset:

| Tabel dengan Soft Delete | Alasan |
|---|---|
| Materi, TopikMateri, KontenBudaya | Konten mungkin perlu diarsipkan tanpa menghapus jejak historisnya |
| BankSoal, Soal | Soal yang sudah dikerjakan siswa tidak boleh hilang total dari histori |
| Siswa, Guru (User) | Akun nonaktif tetap harus meninggalkan jejak data akademik yang valid |
| Kelas | Kelas lama (mis. tahun ajaran sebelumnya) tetap dapat ditelusuri |

**Tabel yang TIDAK menggunakan soft delete (hard delete diperbolehkan terbatas):**

| Tabel | Alasan |
|---|---|
| OpsiJawaban | Bagian struktural dari Soal, mengikuti siklus hidup induknya |
| AnggotaKelas, RelasiMateriBudaya | Tabel relasi murni, tidak menyimpan data historis independen |

**Aturan aplikasi:** Semua query default **wajib memfilter** `deletedAt IS NULL` kecuali secara eksplisit meminta data terarsip (mis. untuk laporan historis penelitian).

---

## 17. FUTURE EXPANSION

Struktur database saat ini dirancang agar hal berikut dapat ditambahkan tanpa migrasi destruktif:

- Tabel `Sekolah` sebagai induk baru dari `Kelas` untuk mendukung multi-sekolah.
- Tabel `Badge`/`Achievement` untuk gamifikasi lanjutan, terhubung ke `Siswa`.
- Tabel `Notifikasi` untuk fitur pengingat.
- Kolom tambahan pada `Soal` untuk mendukung tipe soal baru (esai otomatis dinilai AI, soal dengan gambar interaktif).
- Tabel `Feedback`/`Komentar` jika di masa depan ada fitur interaksi guru-siswa berbasis catatan.

Pendekatan penamaan kolom dan struktur relasi dijaga generik (bukan hardcoded ke skenario spesifik) agar ekspansi ini bersifat **aditif**, bukan mengubah struktur yang sudah ada.

---

## 18. PRISMA PLANNING (CONCEPT ONLY)

**Catatan: bagian ini murni konseptual, tidak memuat syntax Prisma.**

Perencanaan model Prisma akan mengikuti struktur berikut:

- Satu model per entitas pada Bagian 3, dengan penamaan `PascalCase` (standar konvensi Prisma).
- Relasi antar model didefinisikan eksplisit dua arah (relation fields) agar Prisma Client menghasilkan tipe TypeScript yang akurat untuk query bersarang (`include`).
- Enum Prisma digunakan untuk seluruh kolom yang telah ditetapkan sebagai `ENUM` pada Bagian 11 (`Role`, `StatusSesi`, `TipeSoal`, `TipeBankSoal`).
- Middleware Prisma (`$use`) direncanakan untuk menerapkan filter otomatis `deletedAt IS NULL` secara konsisten pada seluruh query, mengurangi risiko developer lupa menambahkan filter manual.
- Migrasi akan dikelola secara incremental per modul mengikuti urutan Roadmap (lihat 05-ROADMAP.md), bukan satu migrasi besar di awal — memudahkan rollback jika terjadi kesalahan skema pada tahap awal pengembangan.
- Seed data awal direncanakan mencakup: satu akun Guru contoh, struktur Materi & Budaya dasar (untuk kebutuhan development/testing), dan bank soal contoh — tanpa data siswa riil (menjaga kepatuhan data penelitian sejak tahap development).

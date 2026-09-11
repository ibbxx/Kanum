# 04 — DEVELOPMENT RULES & STANDARDS

**Produk:** Platform Pembelajaran Matematika Berbasis Etnomatematika Ammatoa Kajang
**Versi Dokumen:** 1.0 (MVP Planning)
**Tujuan:** Standar wajib bagi siapa pun (termasuk kontributor baru/masa depan) yang mengembangkan kode di proyek ini.

---

## DAFTAR ISI

1. Architecture Rules
2. Folder Convention
3. Naming Convention
4. Component Rules
5. Reusable Rules
6. Server Component Rules
7. Client Component Rules
8. API Rules
9. Database Rules
10. Authentication Rules
11. Authorization Rules
12. Validation Rules
13. Error Handling Rules
14. Logging Rules
15. Performance Rules
16. Security Rules
17. Accessibility Rules
18. Responsive Rules
19. TypeScript Rules
20. Tailwind Rules
21. Shadcn Rules
22. Prisma Rules
23. Git Convention
24. Testing Convention
25. Code Review Checklist
26. Best Practices
27. Anti Patterns

---

## 1. ARCHITECTURE RULES

- Setiap fitur baru **wajib** ditempatkan sesuai lapisan arsitektur yang telah ditetapkan pada 01-ARCHITECTURE.md (Presentation → Application → Domain → Data Access).
- Business logic (aturan skor, validasi status pretest/posttest, dsb.) **tidak boleh** ditulis langsung di dalam komponen UI atau Route Handler — wajib berada di Service/Domain Layer (`modules/*`).
- Setiap modul domain (`modules/materi`, `modules/quiz`, dst.) bersifat mandiri — modul lain hanya boleh mengakses modul tersebut melalui exported service/interface publiknya, tidak mengimpor file internal modul secara langsung.
- Perubahan struktural lintas modul (mis. relasi baru antar entitas) wajib didiskusikan/didokumentasikan sebelum implementasi, karena berdampak pada skema database.

## 2. FOLDER CONVENTION

- Struktur folder mengikuti Bagian 11 pada 01-ARCHITECTURE.md — tidak membuat folder root baru tanpa alasan arsitektural yang jelas.
- Route group `(guru)` dan `(siswa)` **wajib** digunakan konsisten untuk memisahkan area akses; halaman baru untuk Guru selalu masuk `(guru)`, begitu pula sebaliknya.
- File yang hanya digunakan oleh satu halaman spesifik boleh dikolokasikan di dalam folder route tersebut; file yang dipakai lintas halaman wajib dipindah ke `components/shared` atau `lib/`.

## 3. NAMING CONVENTION

| Elemen | Konvensi | Contoh |
|---|---|---|
| Folder | `kebab-case` | `bank-soal/` |
| Komponen React | `PascalCase` | `QuizQuestionCard` |
| File komponen | `PascalCase.tsx` | `QuizQuestionCard.tsx` |
| Fungsi/variabel | `camelCase` | `calculateScore()` |
| Konstanta global | `UPPER_SNAKE_CASE` | `MAX_QUIZ_ATTEMPTS` |
| Tipe/Interface TypeScript | `PascalCase`, prefix opsional `T`/`I` dihindari (gunakan nama deskriptif langsung) | `QuizSession`, bukan `IQuizSession` |
| Model Prisma | `PascalCase` singular | `SesiPengerjaan` |
| Service | `PascalCase` + suffix `Service` | `ScoreService` |
| Nama route (URL) | `kebab-case` | `/latihan/bab-2-pecahan` |

**Prinsip umum:** nama harus mendeskripsikan **apa fungsinya**, bukan **di mana letaknya** — hindari nama generik seperti `data.ts`, `helper.ts`, `utils2.ts`.

## 4. COMPONENT RULES

- Satu file komponen hanya berisi satu komponen utama (boleh disertai sub-komponen kecil privat yang tidak diekspor).
- Props komponen wajib memiliki tipe eksplisit — tidak menggunakan `any`.
- Komponen tidak boleh melakukan fetching data langsung di dalam body render tanpa lapisan yang jelas (Server Component fetch di top-level, Client Component menerima data via props atau hook data-fetching yang terkontrol).
- Komponen presentasional (UI murni) dan komponen dengan logic (state, efek) sebaiknya dipisah bila kompleksitas mulai tinggi.

## 5. REUSABLE RULES

- Sebelum membuat komponen baru, cek terlebih dahulu apakah komponen serupa sudah ada di `components/ui` atau `components/shared`.
- Komponen dianggap "reusable" jika dipakai di ≥2 tempat berbeda — begitu kondisi ini terjadi, komponen **wajib** dipindahkan/dinaikkan ke `components/shared`, tidak dibiarkan terduplikasi.
- Styling reusable component tidak boleh mengandung nilai hardcode yang mengasumsikan satu konteks penggunaan spesifik (mis. margin halaman tertentu) — gunakan props untuk variasi.

## 6. SERVER COMPONENT RULES

- Server Component adalah **default** untuk seluruh halaman dan komponen kecuali benar-benar membutuhkan interaktivitas client (event handler, state, browser API).
- Server Component boleh langsung memanggil Service/Domain Layer untuk mengambil data — tidak perlu melalui API Route Handler bila berada dalam aplikasi Next.js yang sama.
- Tidak boleh mengekspos data sensitif (kunci jawaban soal, data siswa lain) ke Client Component kecuali benar-benar dibutuhkan untuk rendering saat itu.

## 7. CLIENT COMPONENT RULES

- Diberi label `"use client"` hanya pada komponen yang benar-benar butuh: state (`useState`), efek (`useEffect`), event handler interaktif, atau library yang bergantung pada browser (mis. Framer Motion animasi berbasis interaksi).
- Client Component sebaiknya berada di level sekecil mungkin dalam pohon komponen ("push client boundary ke bawah") agar tidak membuat seluruh subtree menjadi client-side secara tidak perlu.
- Tidak menyimpan data sensitif (skor jawaban lengkap sebelum submit, kunci jawaban) di state client yang dapat diinspeksi lewat devtools.

## 8. API RULES

- Server Actions digunakan sebagai metode utama mutasi data dari form/interaksi UI (sesuai keputusan arsitektur Bagian 9, 01-ARCHITECTURE.md).
- Route Handler (`app/api/*`) hanya dibuat jika dibutuhkan akses dari luar konteks Server Action (mis. webhook, kebutuhan integrasi eksternal di masa depan).
- Setiap Server Action/Route Handler **wajib**:
  1. Validasi input.
  2. Validasi sesi & otorisasi.
  3. Eksekusi logic melalui Service Layer (tidak menulis query database langsung di dalamnya).
  4. Mengembalikan response terstruktur konsisten (bentuk sukses/error yang seragam di seluruh aplikasi).

## 9. DATABASE RULES

- Seluruh akses database **wajib** melalui Prisma Client — tidak ada raw query kecuali untuk kasus performa spesifik yang telah dikaji dan didokumentasikan alasannya.
- Setiap query yang mengembalikan data milik user tertentu **wajib** difilter berdasarkan identitas sesi (mis. `siswaId` dari sesi login), tidak boleh mengandalkan filter dari input client tanpa verifikasi ulang.
- Query yang berpotensi mengembalikan data dalam jumlah besar (daftar siswa, daftar hasil) wajib menggunakan pagination, tidak mengambil seluruh data sekaligus.
- Perubahan skema database wajib melalui migrasi terkelola (bukan perubahan manual langsung di database production).

## 10. AUTHENTICATION RULES

- Seluruh proses autentikasi wajib melalui Auth.js — tidak membuat mekanisme login custom paralel.
- Password tidak pernah disimpan dalam bentuk plain text di database maupun log.
- Session token disimpan sebagai HTTP-only cookie, tidak diakses/disimpan manual via `localStorage`/`sessionStorage` di sisi client untuk data sensitif.

## 11. AUTHORIZATION RULES

- Setiap route dalam group `(guru)` wajib diproteksi middleware yang memverifikasi role `GURU`; setiap route dalam `(siswa)` wajib diverifikasi role `SISWA`.
- Otorisasi tidak boleh hanya diterapkan di level UI (menyembunyikan tombol) — **wajib** ditegakkan ulang di level Server Action/Service, karena UI dapat dilewati.
- Guru hanya dapat memodifikasi data (materi, soal, budaya) yang merupakan miliknya sendiri kecuali dinyatakan lain secara eksplisit oleh business rule.

## 12. VALIDATION RULES

- Validasi input **wajib dilakukan di server**, validasi di client (jika ada) hanya bersifat pelengkap UX (feedback instan), bukan satu-satunya lapisan pertahanan.
- Skema validasi didefinisikan terpusat per domain (mis. menggunakan pustaka validasi seperti Zod) dan digunakan ulang antara form client dan Server Action, tidak didefinisikan dua kali secara terpisah.
- Semua nilai enum (role, tipe soal, status sesi) divalidasi terhadap daftar nilai yang sah sebelum diproses lebih lanjut.

## 13. ERROR HANDLING RULES

- Error yang ditampilkan ke pengguna **wajib** menggunakan bahasa yang ramah dan dapat dipahami (Bahasa Indonesia, sesuai audiens), tidak menampilkan stack trace atau pesan error teknis mentah.
- Error dari Server Action dikembalikan dalam bentuk terstruktur (status + pesan), ditangani oleh UI dengan state error yang jelas (lihat pola pada 03-UI-UX.md per halaman).
- Kegagalan pada operasi kritis (submit pretest/posttest) wajib memiliki penanganan retry/pemulihan yang eksplisit, bukan sekadar menampilkan pesan gagal tanpa jalan keluar.

## 14. LOGGING RULES

- Aktivitas sensitif (perubahan soal yang sudah dikerjakan, penghapusan data, perubahan status akun siswa) wajib dicatat melalui mekanisme AuditLog (lihat 02-DATABASE.md Bagian 15).
- Log tidak boleh memuat data kredensial (password, token) dalam bentuk apa pun, termasuk pada log debugging development.
- Log error produksi dipisahkan levelnya (info/warning/error) agar mudah difilter saat troubleshooting.

## 15. PERFORMANCE RULES

- Data yang jarang berubah (materi, budaya) memanfaatkan caching/static rendering sesuai strategi pada 01-ARCHITECTURE.md Bagian 23.
- Gambar wajib melalui komponen optimasi gambar bawaan Next.js, tidak menggunakan tag gambar mentah tanpa optimasi untuk aset dari Supabase Storage.
- Query database untuk halaman dashboard/laporan wajib diuji terhadap N+1 query sebelum dianggap selesai — gunakan `include`/`select` Prisma secara eksplisit dan efisien.

## 16. SECURITY RULES

- Seluruh identifier yang muncul di URL (ID sesi, ID siswa) tidak boleh berupa angka berurutan yang mudah ditebak — konsisten dengan keputusan Primary Key CUID (02-DATABASE.md Bagian 7).
- Tidak ada endpoint yang mengembalikan data siswa lain tanpa validasi kepemilikan/relasi eksplisit terhadap sesi yang sedang login.
- Rahasia (API key, credential database) hanya disimpan di environment variable, tidak pernah di-commit ke Git dalam bentuk apa pun.

## 17. ACCESSIBILITY RULES

- Seluruh elemen interaktif (tombol, link, form) wajib dapat dioperasikan via keyboard.
- Kontras warna teks terhadap background wajib memenuhi standar WCAG AA minimum.
- Gambar konten (materi, budaya) wajib memiliki `alt text` deskriptif, tidak kosong atau generik.
- Status/feedback penting (benar/salah, error) tidak boleh disampaikan hanya melalui warna — wajib disertai teks/ikon.

## 18. RESPONSIVE RULES

- Setiap halaman wajib diuji pada tiga breakpoint minimum: mobile (~375px), tablet (~768px), desktop (~1280px), sesuai spesifikasi per halaman pada 03-UI-UX.md.
- Target tap/klik pada perangkat mobile minimum 44x44px sesuai standar kenyamanan sentuh.
- Tidak ada horizontal scroll yang tidak disengaja pada breakpoint manapun.

## 19. TYPESCRIPT RULES

- Mode `strict` TypeScript wajib aktif di seluruh proyek.
- Penggunaan `any` dilarang kecuali pada kasus interoperabilitas pustaka eksternal yang benar-benar tidak menyediakan tipe, dan wajib disertai komentar penjelasan.
- Tipe data domain (mis. `SesiPengerjaan`, `Soal`) sebaiknya diturunkan/diselaraskan dari tipe hasil generate Prisma agar tidak terjadi duplikasi definisi tipe yang bisa saling tidak sinkron.

## 20. TAILWIND RULES

- Styling menggunakan utility class Tailwind langsung; menghindari file CSS custom kecuali untuk kasus yang benar-benar tidak dapat dicapai dengan utility class.
- Nilai warna, spacing, dan typography wajib mengacu pada token desain yang telah ditetapkan pada 03-UI-UX.md Bagian 1 (via konfigurasi tema Tailwind), tidak menggunakan nilai arbitrary (`bg-[#123456]`) tanpa alasan kuat.
- Class yang berulang pada banyak tempat dengan pola sama sebaiknya diekstrak menjadi komponen reusable (lihat Bagian 5), bukan disalin-tempel berulang.

## 21. SHADCN RULES

- Komponen dasar (button, input, dialog, dsb.) menggunakan Shadcn UI sebagai fondasi, dikustomisasi sesuai token desain proyek — tidak membangun ulang komponen dasar dari nol.
- Kustomisasi Shadcn dilakukan pada level konfigurasi tema/variant, bukan dengan override class secara acak berulang kali di tiap penggunaan.

## 22. PRISMA RULES

- Perubahan skema Prisma selalu diikuti migrasi terkelola dan dijalankan di lingkungan development sebelum digabungkan ke branch utama.
- Query kompleks yang digunakan berulang (mis. laporan pretest vs posttest) dienkapsulasi dalam fungsi data-access khusus di `lib/db` atau `modules/*`, tidak ditulis ulang inline di berbagai tempat.
- Middleware Prisma untuk soft delete (filter `deletedAt IS NULL`) wajib diterapkan secara global sesuai rencana pada 02-DATABASE.md Bagian 18, tidak mengandalkan developer menambahkan filter manual di setiap query.

## 23. GIT CONVENTION

| Aspek | Aturan |
|---|---|
| Branch utama | `main` (selalu dalam kondisi dapat di-deploy) |
| Branch fitur | `feature/nama-fitur` |
| Branch perbaikan | `fix/nama-perbaikan` |
| Commit message | Format singkat-jelas: `feat: tambah modul quiz engine`, `fix: perbaiki validasi pretest ganda` |
| Pull Request | Wajib deskripsi singkat perubahan + checklist relevan sebelum merge ke `main` |

## 24. TESTING CONVENTION

- Logic kritis pada Domain/Service Layer (skoring, validasi status sesi, aturan satu-kali-kerjakan) wajib memiliki unit test, mengingat dampaknya langsung pada validitas data penelitian.
- Alur pengerjaan pretest/posttest end-to-end sebaiknya memiliki minimal satu skenario pengujian manual terdokumentasi sebelum rilis ke pengguna riil (mengingat skala MVP, automated E2E test bersifat rekomendasi, bukan wajib mutlak).
- Perubahan pada skema database wajib diuji di lingkungan development dengan data contoh sebelum diterapkan ke lingkungan yang menyimpan data riset riil.

## 25. CODE REVIEW CHECKLIST

Sebelum merge, pastikan:

- [ ] Business logic berada di Service/Domain Layer, bukan di komponen UI.
- [ ] Tidak ada data sensitif (kunci jawaban, data siswa lain) bocor ke Client Component.
- [ ] Validasi input dilakukan di server, bukan hanya client.
- [ ] Otorisasi role diterapkan ulang di server, bukan hanya disembunyikan di UI.
- [ ] Query database sudah terindeks/efisien, tidak berpotensi N+1.
- [ ] Komponen baru sudah dicek potensi duplikasi dengan komponen reusable yang ada.
- [ ] Halaman baru sudah diuji di tiga breakpoint (mobile/tablet/desktop).
- [ ] Tidak ada nilai `any` tanpa justifikasi di TypeScript.
- [ ] Tidak ada credential/API key ter-hardcode dalam kode.
- [ ] Pesan error yang ditampilkan ke pengguna sudah ramah dan berbahasa Indonesia yang jelas.

## 26. BEST PRACTICES

- Selalu mulai fitur baru dari mendefinisikan tipe data & kontrak Service terlebih dahulu, sebelum membangun UI di atasnya.
- Prioritaskan Server Component; turunkan ke Client Component hanya saat benar-benar dibutuhkan.
- Jaga konsistensi bahasa: seluruh UI berbahasa Indonesia, kode (nama variabel/fungsi) tetap menggunakan istilah domain yang jelas walau boleh campuran teknis Inggris untuk konsistensi dengan ekosistem TypeScript.
- Dokumentasikan keputusan penting yang menyimpang dari dokumen ini secara eksplisit di kode (komentar) atau catatan pengembangan.

## 27. ANTI PATTERNS

Hal-hal berikut **dilarang** dilakukan dalam proyek ini:

- ❌ Menulis query database langsung di dalam komponen UI atau Route Handler tanpa melalui Service Layer.
- ❌ Menyimpan kunci jawaban soal di Client Component atau mengirimkannya ke browser sebelum submit.
- ❌ Mengandalkan validasi client-side sebagai satu-satunya lapisan validasi.
- ❌ Membuat role/logic otorisasi tambahan secara ad-hoc di luar skema yang telah ditetapkan tanpa pembaruan dokumen arsitektur.
- ❌ Hardcode ID, warna, atau string yang seharusnya berasal dari konfigurasi/token desain terpusat.
- ❌ Membuat komponen duplikat yang secara fungsional identik dengan komponen reusable yang sudah ada.
- ❌ Melakukan hard delete pada entitas yang telah ditetapkan menggunakan soft delete (02-DATABASE.md Bagian 16).
- ❌ Menambahkan fitur di luar lingkup MVP (lihat 01-ARCHITECTURE.md Bagian 5) tanpa memindahkannya terlebih dahulu ke pembahasan Future Development dan persetujuan eksplisit.
- ❌ Mengizinkan siswa mengulang pretest/posttest melalui celah apa pun (mis. manipulasi state client) — aturan ini wajib ditegakkan berlapis (DB constraint + Service validation).
- ❌ Menampilkan pesan error teknis mentah (stack trace, nama exception) kepada pengguna akhir.

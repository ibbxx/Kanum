# 03 — UI/UX DESIGN SPECIFICATION

> **⚠️ STATUS: DOKUMEN PERENCANAAN MVP (v1.0).** Sebagian gaya visual sudah
> diimplementasikan (token warna Tailwind ada di `tailwind.config.ts`, dan
> `Docs/DESIGN.md` sesuai dengan implementasi). Untuk perilaku UI yang berlaku,
> kode di `components/` dan `app/globals.css` adalah acuan utama.

**Produk:** Platform Pembelajaran Matematika Berbasis Etnomatematika Ammatoa Kajang
**Versi Dokumen:** 1.0 (MVP Planning)
**Filosofi Desain:** Simple but Powerful, Educational First, Modern SaaS Dashboard

---

## DAFTAR ISI

1. Design System Foundation
2. Landing Page
3. Login Page
4. Dashboard Guru
5. Dashboard Siswa
6. Halaman Materi
7. Halaman Budaya
8. Halaman Latihan
9. Halaman Quiz
10. Halaman Hasil
11. Halaman Laporan
12. Halaman Profile
13. Halaman Settings

---

## 1. DESIGN SYSTEM FOUNDATION

Sebelum masuk ke tiap halaman, berikut fondasi desain yang berlaku konsisten di seluruh aplikasi.

### 1.1 Color Palette (Konsep)

| Peran | Warna | Penggunaan |
|---|---|---|
| Primary | Deep Teal/Emerald (terinspirasi warna kain adat gelap) | Tombol utama, aksen navigasi aktif |
| Secondary | Warm Terracotta/Earth Brown | Aksen budaya, badge, highlight etnomatematika |
| Accent | Soft Gold | Elemen gamifikasi (bintang, lencana, progress) |
| Neutral Base | Off-white / Slate Gray scale | Background, teks, border |
| Success | Green | Jawaban benar, status selesai |
| Warning | Amber | Peringatan, sesi hampir habis waktu |
| Error | Red (muted, tidak neon) | Jawaban salah, validasi gagal |

**Justifikasi:** Palet menghindari warna "generik SaaS biru-ungu" agar aplikasi memiliki identitas visual yang terhubung dengan tema budaya Ammatoa Kajang (warna tenun gelap & earth-tone), namun tetap profesional dan tidak norak.

### 1.2 Typography

| Elemen | Font Category | Alasan |
|---|---|---|
| Heading | Sans-serif geometris modern (mis. kelas Inter/Plus Jakarta Sans) | Kesan modern, mudah dibaca di layar |
| Body Text | Sans-serif humanis, ukuran nyaman baca | Kenyamanan baca materi panjang |
| Angka/Skor | Tabular numerals | Skor dan tabel numerik rapi sejajar |

### 1.3 Spacing & Grid System

- Menggunakan skala spacing konsisten (4px base unit: 4, 8, 12, 16, 24, 32, 48, 64).
- Grid 12-kolom untuk desktop, 4-kolom untuk mobile.
- Container max-width terbatas agar teks materi tidak terlalu lebar dibaca (readability).

### 1.4 Iconography

- Set ikon tunggal dan konsisten (line-icon style, bukan campuran filled+outline).
- Ikon khusus budaya (motif tenun sederhana sebagai aksen dekoratif, bukan ikon fungsional) digunakan terbatas agar tidak mengganggu fungsi UI.

### 1.5 Motion Principles

- Framer Motion dipakai untuk: transisi halaman halus, feedback jawaban (benar/salah), progress bar animasi, micro-interaction tombol.
- Durasi animasi singkat (150–300ms) agar terasa cepat, bukan lambat/berat.

---

## 2. LANDING PAGE

### Purpose
Memperkenalkan platform kepada pengunjung publik (guru/siswa/pihak lain) sebelum login, membangun kepercayaan bahwa ini adalah produk EdTech serius.

### Target User
Guru (calon pengguna), siswa, dan pihak terkait penelitian (dosen pembimbing, reviewer).

### User Goal
Memahami apa itu platform ini dalam <30 detik, lalu menuju halaman login.

### Wireframe ASCII

```
┌──────────────────────────────────────────────────┐
│  [Logo]                    [Fitur] [Tentang] [Masuk]│  ← Navbar
├──────────────────────────────────────────────────┤
│                                                     │
│     Belajar Matematika Lewat Budaya Ammatoa Kajang  │
│     Numerasi jadi lebih bermakna & membumi          │
│                                                     │
│         [Ilustrasi hero: motif tenun + angka]        │
│                                                     │
│              [ Mulai Belajar ]  [ Pelajari Lebih ]   │
│                                                     │
├──────────────────────────────────────────────────┤
│   [Icon] Materi     [Icon] Budaya    [Icon] Quiz     │  ← Feature highlights
├──────────────────────────────────────────────────┤
│         "Tentang Etnomatematika Tope' Le'Leng"       │
│         [Gambar]     [Deskripsi singkat]              │
├──────────────────────────────────────────────────┤
│                    [Footer]                          │
└──────────────────────────────────────────────────┘
```

### Layout Structure
Single-column hero-first layout, diikuti section fitur horizontal, section edukasi budaya, footer.

### Components
Navbar, Hero Section, CTA Button (primary+secondary), Feature Card (3x), Culture Highlight Section, Footer.

### Interaction
CTA "Mulai Belajar" dan "Masuk" mengarah ke Login. Scroll-triggered fade-in pada tiap section.

### User Journey
Pengunjung datang → membaca hero → scroll melihat fitur → tertarik → klik Login.

### Navigation
Navbar sticky, link ke section internal (anchor scroll) + tombol Masuk.

### Animation
Fade-up saat elemen masuk viewport, subtle parallax pada ilustrasi hero (opsional, ringan).

### Micro Interaction
Hover state pada tombol CTA (scale halus + shadow), hover card fitur (elevasi ringan).

### Color
Dominan warna Primary (teal) untuk hero background gradasi lembut, aksen Secondary (terracotta) pada highlight budaya.

### Typography
Heading besar (hero) bold, subheading regular, body text section fitur medium.

### Spacing
Section dipisah spacing besar (64–96px vertikal) agar tidak terasa padat.

### Grid System
12-kolom desktop; feature cards 3 kolom desktop → 1 kolom mobile.

### Icon
Ikon sederhana per fitur (buku untuk Materi, motif tenun untuk Budaya, checklist untuk Quiz).

### Responsive Behaviour

**Desktop:** Hero dua kolom (teks kiri, ilustrasi kanan), feature cards 3 kolom sejajar.
**Tablet:** Hero tetap dua kolom tapi lebih ringkas, feature cards 2 kolom.
**Mobile:** Hero satu kolom (teks di atas, ilustrasi di bawah/disederhanakan), feature cards stack vertikal.

### Empty State
Tidak relevan (halaman statis publik).

### Loading State
Skeleton ringan untuk gambar hero jika lambat dimuat.

### Error State
Fallback jika gambar gagal dimuat → tampilkan ilustrasi placeholder bertema, bukan broken image icon.

### Accessibility
Kontras teks di atas gradasi warna dijaga WCAG AA, alt text deskriptif pada semua gambar budaya.

### Design Notes
Landing page harus menghindari kesan "template SaaS generik" — elemen budaya (motif tenun sebagai aksen visual, bukan dekorasi berlebihan) menjadi pembeda visual utama.

---

## 3. LOGIN PAGE

### Purpose
Titik masuk tunggal untuk kedua role (Guru & Siswa); sistem mendeteksi role dari akun, bukan dari pilihan manual pengguna.

### Target User
Guru dan Siswa terdaftar.

### User Goal
Masuk secepat mungkin dengan minim friksi.

### Wireframe ASCII

```
┌───────────────────────────────┐
│         [Logo Kecil]            │
│                                 │
│      Masuk ke Akun Anda          │
│                                 │
│   [ Email/Username        ]     │
│   [ Password               ]🔒  │
│                                 │
│        [ Masuk ]               │
│                                 │
│   Lupa password? (opsional)     │
└───────────────────────────────┘
```

### Layout Structure
Single centered card di atas background bertema (subtle motif), tanpa navbar kompleks — fokus penuh pada form.

### Components
Logo, Input Field (email/username), Input Field (password dengan toggle show/hide), Primary Button, Error Message Inline, Link "Lupa Password" (jika masuk MVP).

### Interaction
Validasi inline saat blur field, tombol disabled sampai form valid, redirect otomatis ke dashboard sesuai role setelah sukses.

### User Journey
Klik "Masuk" dari Landing → isi form → submit → sistem validasi → redirect ke Dashboard Guru/Siswa sesuai role.

### Navigation
Tidak ada navigasi kompleks; hanya link kembali ke Landing di logo.

### Animation
Card fade-in+scale saat halaman dimuat; shake halus pada form saat error kredensial.

### Micro Interaction
Input field highlight border saat focus; button loading spinner saat submit diproses.

### Color
Background netral dengan aksen Primary pada tombol; error state memakai warna Error (merah muted).

### Typography
Judul form medium-bold, label input kecil namun jelas.

### Spacing
Form compact namun tidak sempit — spacing antar field cukup untuk touch target mobile.

### Grid System
Single column, max-width form ±400px, centered.

### Icon
Ikon mata untuk toggle password visibility, ikon lock kecil dekoratif (opsional).

### Responsive Behaviour

**Desktop:** Card login di tengah layar dengan background dekoratif di sekelilingnya.
**Tablet:** Card tetap center, background lebih sederhana.
**Mobile:** Card memenuhi lebar layar dengan padding aman, background dekoratif diminimalkan agar tidak mengganggu keterbacaan.

### Empty State
Tidak relevan.

### Loading State
Tombol "Masuk" menampilkan spinner + teks "Memproses..." saat submit.

### Error State
Pesan error jelas di atas form: "Email atau password salah" — tidak spesifik menyebut mana yang salah (praktik keamanan standar).

### Accessibility
Label form terhubung eksplisit ke input (bukan hanya placeholder), pesan error terbaca oleh screen reader (aria-live).

### Design Notes
Login harus terasa cepat dan tidak "berat" — ini adalah halaman dengan tekanan waktu tertinggi (siswa ingin segera mulai belajar).

---

## 4. DASHBOARD GURU

### Purpose
Pusat kendali guru: ringkasan aktivitas kelas dan akses cepat ke seluruh modul pengelolaan.

### Target User
Guru.

### User Goal
Melihat kondisi kelas sekilas (siapa yang aktif, progres umum) dan menuju modul yang dibutuhkan secepat mungkin.

### Wireframe ASCII

```
┌────────┬─────────────────────────────────────────┐
│         │  Selamat datang, Bu/Pak [Nama]            │
│ Sidebar │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│         │  │Siswa  │ │Materi │ │Rata2  │ │Pretest │  │
│ Dashboard│  │Aktif  │ │Terbit │ │Skor   │ │Selesai │  │
│ Materi   │  └───────┘ └───────┘ └───────┘ └───────┘  │
│ Budaya   │                                            │
│ Soal     │  Progress Kelas (chart ringkas)             │
│ Siswa    │  ┌────────────────────────────────────┐   │
│ Laporan  │  │        [Bar/line chart]              │   │
│ Settings │  └────────────────────────────────────┘   │
│         │                                            │
│         │  Aktivitas Terbaru                          │
│         │  - Siswa A menyelesaikan Quiz Bab 2           │
│         │  - Siswa B memulai Posttest                   │
└────────┴─────────────────────────────────────────┘
```

### Layout Structure
Layout dashboard klasik: Sidebar navigasi tetap (kiri) + Main content area dengan grid kartu statistik di atas, chart di tengah, aktivitas terbaru di bawah.

### Components
Sidebar Navigation, Topbar (profil singkat + notifikasi), Stat Card (4x), Chart Widget, Activity Feed List, Quick Action Button.

### Interaction
Klik stat card → menuju halaman detail terkait (mis. klik "Pretest Selesai" → Laporan). Sidebar item aktif ter-highlight.

### User Journey
Login → Dashboard tampil ringkasan → guru memutuskan mau ke Materi/Soal/Laporan → klik sidebar.

### Navigation
Sidebar persisten di semua halaman Guru; topbar berisi shortcut profil & logout.

### Animation
Stat card angka melakukan count-up animation singkat saat dashboard dimuat; chart fade-in.

### Micro Interaction
Sidebar item hover memberi highlight halus; badge notifikasi (jika ada) pulse ringan.

### Color
Stat card menggunakan aksen warna berbeda tipis per kategori (bukan warna mencolok penuh) agar tetap tenang secara visual.

### Typography
Angka statistik besar & bold (fokus utama), label kecil di bawahnya.

### Spacing
Grid stat card dengan gap konsisten (16–24px), section dipisah jelas dengan whitespace.

### Grid System
Sidebar fixed width (±240px) + main content fluid; stat cards grid 4 kolom desktop.

### Icon
Ikon representatif tiap stat card (siswa, buku, grafik, checklist).

### Responsive Behaviour

**Desktop:** Sidebar terbuka penuh dengan label teks, grid 4 kolom stat card.
**Tablet:** Sidebar dapat collapse jadi ikon saja, grid stat card 2 kolom.
**Mobile:** Sidebar berubah jadi bottom navigation atau hamburger drawer, stat card stack 1 kolom/scroll horizontal.

### Empty State
Jika belum ada siswa/materi: tampilkan ilustrasi + CTA "Tambahkan Materi Pertama Anda" / "Undang Siswa".

### Loading State
Skeleton loader pada stat card dan chart saat data dimuat.

### Error State
Jika data gagal dimuat: pesan ramah "Gagal memuat data dashboard" + tombol coba lagi, bukan halaman putih kosong.

### Accessibility
Chart disertai data dalam bentuk tabel tersembunyi (untuk screen reader), kontras warna stat card dijaga.

### Design Notes
Dashboard harus memberi "gambaran satu layar" tanpa perlu scroll berlebihan — prioritaskan informasi paling actionable di atas.

---

## 5. DASHBOARD SISWA

### Purpose
Ruang belajar utama siswa: melanjutkan aktivitas belajar, melihat progres, dan elemen motivasi ringan (gamifikasi).

### Target User
Siswa SMP.

### User Goal
Cepat tahu "apa yang harus saya lanjutkan/kerjakan hari ini".

### Wireframe ASCII

```
┌────────┬─────────────────────────────────────────┐
│         │  Halo, [Nama Siswa]! 👋                    │
│ Sidebar │  Streak belajar: 3 hari 🔥                  │
│         │                                            │
│ Dashboard│  ┌────────────────────────────────────┐   │
│ Materi   │  │  Lanjutkan Belajar: Bab 3 - Pecahan   │   │
│ Budaya   │  │  [Progress bar 60%]  [Lanjutkan →]     │   │
│ Latihan  │  └────────────────────────────────────┘   │
│ Quiz     │                                            │
│ Hasil    │  Progress Belajar Keseluruhan               │
│ Settings │  ┌───────┐ ┌───────┐ ┌───────┐              │
│         │  │Materi │ │Latihan│ │Quiz   │              │
│         │  │70%    │ │5/10   │ │3/5    │              │
│         │  └───────┘ └───────┘ └───────┘              │
│         │                                            │
│         │  Eksplorasi Budaya Terbaru [Card carousel]   │
└────────┴─────────────────────────────────────────┘
```

### Layout Structure
Sidebar + main content dengan hero "lanjutkan belajar" di atas (paling actionable), diikuti ringkasan progres, lalu rekomendasi konten budaya.

### Components
Sidebar Navigation, Continue Learning Card (dengan progress bar), Progress Stat Cards, Streak Indicator, Content Carousel (Budaya), Badge/Achievement mini display (gamifikasi ringan).

### Interaction
Klik "Lanjutkan →" langsung membawa siswa ke posisi terakhir di materi. Carousel budaya dapat di-swipe/scroll horizontal.

### User Journey
Login → lihat apa yang perlu dilanjutkan → klik lanjutkan → belajar → kembali ke dashboard untuk cek progres.

### Navigation
Sidebar sama seperti Guru namun menu berbeda sesuai FR-S; pada mobile diprioritaskan sebagai bottom nav karena siswa lebih banyak akses via HP.

### Animation
Progress bar mengisi dengan animasi saat pertama dimuat; streak icon api berkedip halus jika streak aktif.

### Micro Interaction
Tap card memberi feedback tekan (scale down halus), badge baru muncul dengan animasi "pop".

### Color
Lebih hangat dan playful dibanding Dashboard Guru (aksen Accent/gold pada elemen gamifikasi) namun tetap dalam batas palet agar konsisten brand.

### Typography
Sapaan personal besar & ramah, angka progress jelas terbaca.

### Spacing
Card "Lanjutkan Belajar" diberi ruang paling dominan di viewport awal (above the fold).

### Grid System
Mirip Dashboard Guru namun prioritas vertikal: hero card full-width dahulu, baru grid stat 3 kolom.

### Icon
Ikon api (streak), ikon buku/lencana untuk pencapaian ringan.

### Responsive Behaviour

**Desktop:** Sidebar penuh + layout dua kolom (main content + panel rekomendasi di kanan, opsional).
**Tablet:** Sidebar collapse, layout satu kolom dengan card lebih lebar.
**Mobile:** Bottom navigation menggantikan sidebar, hero card "Lanjutkan Belajar" tetap prioritas teratas.

### Empty State
Siswa baru (belum ada progres): tampilkan CTA ramah "Mulai petualangan belajarmu!" mengarah ke Materi pertama.

### Loading State
Skeleton pada hero card dan carousel budaya.

### Error State
Pesan sederhana dan tidak menakutkan: "Ups, data belum bisa dimuat. Coba lagi ya!" sesuai nada bicara ke siswa SMP.

### Accessibility
Streak/gamifikasi tidak boleh menjadi satu-satunya indikator (tersedia juga dalam teks eksplisit, bukan hanya ikon), kontras cukup untuk elemen berwarna gold di atas background terang.

### Design Notes
Nada bahasa dan visual harus terasa mendukung (encouraging), bukan menghakimi — penting untuk motivasi belajar siswa SMP; gamifikasi tetap ringan sesuai spesifikasi (bukan berlebihan seperti game).

---

## 6. HALAMAN MATERI

### Purpose
Menyajikan konten pembelajaran matematika yang terintegrasi dengan etnomatematika secara terstruktur.

### Target User
Siswa (baca) dan Guru (kelola).

### User Goal (Siswa)
Memahami konsep matematika dengan mudah, melihat koneksinya ke budaya Ammatoa Kajang.

### Wireframe ASCII — Tampilan Siswa (Daftar Materi)

```
┌────────┬─────────────────────────────────────────┐
│ Sidebar │  Materi Pembelajaran                       │
│         │  [Search/Filter Bab]                        │
│         │  ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│         │  │ Bab 1        │ │ Bab 2        │ │ Bab 3     │ │
│         │  │ Bilangan     │ │ Pecahan      │ │ Geometri  │ │
│         │  │ [✓ selesai]  │ │ [60%]        │ │ [Terkunci?]│ │
│         │  └────────────┘ └────────────┘ └──────────┘ │
└────────┴─────────────────────────────────────────┘
```

### Wireframe ASCII — Detail Materi (Reading View)

```
┌──────────────────────────────────────────────────┐
│  ← Kembali          Bab 2: Pecahan                  │
├──────────────────────────────────────────────────┤
│  [Progress bar topik dalam bab ini]                  │
│                                                     │
│  ## Konsep Pecahan dalam Motif Tope' Le'Leng          │
│  [Ilustrasi motif tenun dengan pola berulang]          │
│  Teks penjelasan materi...                            │
│                                                     │
│  [→ Lihat Eksplorasi Budaya Terkait]                  │
│                                                     │
│  [ Lanjut ke Latihan → ]                             │
└──────────────────────────────────────────────────┘
```

### Layout Structure
Daftar materi berbentuk grid card per bab; halaman detail berbentuk reading-view single column dengan lebar terbatas untuk keterbacaan optimal.

### Components
Chapter Card (dengan progress indicator), Search/Filter Bar, Reading Content Block, Inline Image/Illustration, Related Culture Link Card, CTA "Lanjut ke Latihan".

### Interaction
Klik chapter card → masuk ke topik pertama yang belum selesai (bukan selalu topik 1). Tombol "Lihat Eksplorasi Budaya Terkait" membuka halaman Budaya dengan konteks materi yang sama.

### User Journey
Dashboard → Materi → pilih Bab → baca topik demi topik → sisipan referensi budaya → selesai bab → CTA ke Latihan.

### Navigation
Breadcrumb sederhana (Materi > Bab X > Topik Y), tombol kembali selalu tersedia.

### Animation
Progress bar bab terisi bertahap saat topik diselesaikan; transisi antar topik slide halus.

### Micro Interaction
Checkbox/centang otomatis muncul dengan animasi saat topik ditandai selesai (auto saat scroll selesai membaca atau klik manual "Tandai Selesai").

### Color
Konten reading-view menggunakan background netral terang untuk fokus baca, aksen warna hanya pada elemen interaktif (link, tombol, badge selesai).

### Typography
Body text materi menggunakan ukuran nyaman baca (16–18px setara), line-height longgar untuk teks panjang.

### Spacing
Margin kiri-kanan reading view cukup lebar di desktop agar tidak seperti dokumen sempit; padding vertikal antar blok konten konsisten.

### Grid System
Grid daftar bab: 3 kolom desktop; reading view: single column max-width ±720px.

### Icon
Ikon centang untuk status selesai, ikon gembok untuk topik yang belum terbuka (jika ada sistem urutan wajib).

### Responsive Behaviour

**Desktop:** Grid bab 3 kolom, reading view lebar terbatas dengan margin luas di kanan-kiri.
**Tablet:** Grid bab 2 kolom, reading view margin menyesuaikan.
**Mobile:** Grid bab 1 kolom (stack), reading view full-width dengan padding aman baca.

### Empty State
Belum ada materi diterbitkan guru: siswa melihat pesan "Materi belum tersedia, nantikan ya!"

### Loading State
Skeleton card untuk daftar bab; skeleton paragraf untuk reading view.

### Error State
Materi gagal dimuat: tombol "Muat Ulang" dengan pesan ramah, tidak menampilkan error teknis mentah ke siswa.

### Accessibility
Heading terstruktur (H1-H2-H3) agar screen reader dapat navigasi materi, alt text pada seluruh ilustrasi budaya/matematika.

### Design Notes
Reading experience adalah inti dari domain penelitian ini — harus senyaman membaca artikel berkualitas tinggi, bukan seperti dokumen PDF ditempel ke web.

---

## 7. HALAMAN BUDAYA

### Purpose
Ruang eksplorasi konten budaya Ammatoa Kajang, khususnya teknik Pattannungan Kain Tope' Le'Leng, sebagai konteks nyata numerasi.

### Target User
Siswa (eksplorasi), Guru (kelola).

### User Goal
Memahami hubungan antara pola tenun tradisional dengan konsep matematika secara visual dan naratif.

### Wireframe ASCII

```
┌──────────────────────────────────────────────────┐
│  Eksplorasi Budaya Ammatoa Kajang                    │
├──────────────────────────────────────────────────┤
│  [Galeri visual motif tenun - grid gambar]            │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │ [Gambar besar motif]                          │   │
│  │ Pattannungan Kain Tope' Le'Leng                 │   │
│  │ Deskripsi naratif budaya...                     │   │
│  │ Koneksi Matematika: pola simetri & perulangan    │   │
│  │ [→ Pelajari Materi Terkait]                      │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### Layout Structure
Galeri visual di atas (grid gambar sebagai pintu masuk), diikuti detail konten naratif per item budaya dengan tautan balik ke materi matematika terkait.

### Components
Gallery Grid, Culture Detail Card, Narrative Text Block, Math Connection Callout Box, Related Materi Link.

### Interaction
Klik item galeri → scroll/navigasi ke detail konten; callout "Koneksi Matematika" dapat diklik untuk highlight bagian materi terkait.

### User Journey
Dashboard/Materi → Budaya → jelajahi galeri → baca satu konten budaya → koneksi ke materi → kembali belajar materi dengan konteks lebih kaya.

### Navigation
Tab/filter kategori budaya (jika kontennya lebih dari satu jenis di masa depan), breadcrumb sederhana.

### Animation
Galeri gambar fade-in staggered saat dimuat; callout box "Koneksi Matematika" muncul dengan slide-in halus untuk menekankan pentingnya elemen ini.

### Micro Interaction
Hover pada galeri gambar memberi overlay judul singkat; klik memberi efek transisi smooth ke detail.

### Color
Section ini boleh sedikit lebih ekspresif menggunakan warna Secondary (terracotta/earth-tone) untuk mencerminkan identitas budaya, tetap dalam batas konsistensi brand.

### Typography
Judul konten budaya menggunakan gaya sedikit lebih naratif/hangat dibanding halaman Materi yang lebih akademis.

### Spacing
Galeri grid dengan gap nyaman antar gambar; detail konten memiliki padding besar agar gambar "bernapas".

### Grid System
Galeri grid: 4 kolom desktop, 2 kolom tablet, 1-2 kolom mobile (grid rapat).

### Icon
Ikon minimal, lebih mengandalkan visual foto/ilustrasi budaya itu sendiri sebagai elemen utama.

### Responsive Behaviour

**Desktop:** Galeri grid lebar dengan detail konten di layout dua kolom (gambar besar + teks di samping).
**Tablet:** Galeri grid menyesuaikan, detail konten menjadi satu kolom (gambar di atas teks).
**Mobile:** Galeri grid rapat 2 kolom, detail konten full-width stack vertikal.

### Empty State
Belum ada konten budaya: pesan "Konten budaya sedang disiapkan oleh guru Anda."

### Loading State
Skeleton grid galeri (blok abu-abu placeholder proporsional gambar).

### Error State
Gambar gagal dimuat: fallback ilustrasi bertema (bukan ikon broken image generik), teks tetap dapat dibaca.

### Accessibility
Alt text budaya harus deskriptif dan kontekstual (bukan generik "gambar 1"), penting mengingat ini konten inti penelitian.

### Design Notes
Halaman ini adalah **jiwa penelitian** — kualitas visual dan naratif di sini harus mendapat perhatian desain tertinggi dibanding halaman lain, karena inilah pembeda utama platform ini dari EdTech generik.

---

## 8. HALAMAN LATIHAN

### Purpose
Ruang latihan soal bebas tekanan (tidak dinilai formal secara ketat seperti test) untuk memperkuat pemahaman siswa dengan umpan balik langsung.

### Target User
Siswa.

### User Goal
Berlatih dan langsung tahu benar/salah beserta penjelasan, tanpa rasa takut gagal.

### Wireframe ASCII

```
┌──────────────────────────────────────────────────┐
│  Latihan: Bab 2 - Pecahan          Soal 3 dari 10    │
│  [Progress dots ●●●○○○○○○○]                          │
├──────────────────────────────────────────────────┤
│  Berapa hasil dari pola pengulangan motif berikut?    │
│  [Ilustrasi soal bertema motif tenun]                  │
│                                                     │
│  ○ Opsi A                                           │
│  ● Opsi B (dipilih)                                  │
│  ○ Opsi C                                           │
│  ○ Opsi D                                           │
│                                                     │
│  [ Periksa Jawaban ]                                 │
└──────────────────────────────────────────────────┘
```

### Wireframe ASCII — Feedback Langsung

```
┌──────────────────────────────────────────────────┐
│  ✓ Benar!                                            │
│  Penjelasan singkat mengapa jawaban ini benar...      │
│  [ Lanjut ke Soal Berikutnya → ]                      │
└──────────────────────────────────────────────────┘
```

### Layout Structure
Single focus layout — satu soal per layar, progress indicator di atas, feedback muncul sebagai state berikutnya (bukan modal mengganggu).

### Components
Progress Dots/Bar, Question Card, Answer Option List, Submit Button, Feedback Panel (benar/salah + penjelasan), Next Button.

### Interaction
Pilih opsi → tombol "Periksa Jawaban" aktif → klik → tampil feedback instan → lanjut soal berikutnya.

### User Journey
Materi selesai → CTA ke Latihan → kerjakan soal satu per satu dengan feedback → selesai → kembali ke Materi/Dashboard dengan progress terupdate.

### Navigation
Tombol kembali dengan konfirmasi jika keluar di tengah latihan (agar tidak kehilangan progres tanpa sadar); latihan bisa diulang kapan saja (tidak dikunci seperti pretest/posttest).

### Animation
Feedback panel slide-up dengan warna sesuai status (hijau/merah lembut); progress dots mengisi dengan transisi halus.

### Micro Interaction
Opsi jawaban memberi highlight border saat dipilih; tombol submit memiliki state disabled→enabled yang jelas.

### Color
Feedback benar menggunakan warna Success, feedback salah menggunakan warna Error yang tetap lembut (tidak agresif) — mengingat ini ruang latihan bebas tekanan.

### Typography
Pertanyaan soal jelas dan cukup besar sebagai fokus utama layar.

### Spacing
Layout padat namun tetap ada whitespace agar tidak terasa seperti ujian formal.

### Grid System
Single column terpusat, max-width sedang (±600-700px) agar fokus.

### Icon
Ikon centang (benar) dan silang (salah) pada feedback panel.

### Responsive Behaviour

**Desktop:** Card soal terpusat dengan lebar sedang, banyak whitespace di kiri-kanan.
**Tablet:** Card soal menyesuaikan lebar layar dengan padding proporsional.
**Mobile:** Card soal full-width dengan padding aman, tombol jawaban full-width untuk kemudahan tap.

### Empty State
Belum ada soal latihan untuk topik ini: pesan "Latihan untuk bab ini belum tersedia."

### Loading State
Skeleton card soal saat transisi antar soal (jika perlu fetch bertahap).

### Error State
Gagal submit jawaban (mis. koneksi terputus): pesan jelas "Gagal mengirim jawaban, coba lagi" dengan tombol retry, jawaban yang sudah dipilih tidak hilang.

### Accessibility
Opsi jawaban dapat dipilih via keyboard (tab+enter), status benar/salah tidak hanya mengandalkan warna (disertai ikon+teks).

### Design Notes
Nada latihan harus terasa aman untuk mencoba dan salah — berbeda secara psikologis dari Quiz/Test yang lebih formal.

---

## 9. HALAMAN QUIZ

Termasuk juga pola untuk **Pretest** dan **Posttest**, dengan perbedaan pada tingkat "keketatan" (locked-state) sesuai FR-S05/FR-S06.

### Purpose
Mengukur pemahaman siswa secara lebih formal per topik (Quiz) atau secara menyeluruh (Pretest/Posttest) untuk kebutuhan data penelitian.

### Target User
Siswa.

### User Goal
Menyelesaikan penilaian dengan jelas mengetahui aturan (jumlah soal, apakah bisa diulang, sisa waktu jika ada).

### Wireframe ASCII — Halaman Instruksi (Sebelum Mulai)

```
┌──────────────────────────────────────────────────┐
│  Pretest: Kemampuan Numerasi Awal                    │
│                                                     │
│  • Jumlah soal: 15                                   │
│  • Estimasi waktu: 20 menit                           │
│  • ⚠ Pretest hanya dapat dikerjakan SATU KALI          │
│                                                     │
│              [ Mulai Pretest ]                        │
└──────────────────────────────────────────────────┘
```

### Wireframe ASCII — Sesi Berlangsung

```
┌──────────────────────────────────────────────────┐
│  Soal 5/15                      ⏱ 12:45 tersisa       │
│  [Progress bar]                                       │
├──────────────────────────────────────────────────┤
│  [Pertanyaan]                                         │
│  ○ A   ○ B   ○ C   ○ D                                 │
│                                                     │
│              [ Soal Berikutnya → ]                    │
└──────────────────────────────────────────────────┘
```

### Wireframe ASCII — Konfirmasi Submit

```
┌──────────────────────────────────────────────────┐
│  Yakin ingin mengumpulkan jawaban?                    │
│  Anda telah menjawab 15 dari 15 soal.                  │
│  Tindakan ini TIDAK DAPAT dibatalkan untuk Pretest.     │
│         [ Batal ]        [ Ya, Kumpulkan ]              │
└──────────────────────────────────────────────────┘
```

### Layout Structure
Tiga state layout berbeda: Instruksi (pre-session) → Sesi Aktif (single-question focus) → Konfirmasi Submit (modal tegas khusus pretest/posttest).

### Components
Instruction Card, Rule List, Timer Component (jika dipakai), Question Card, Answer Options, Progress Indicator, Confirmation Modal (dengan penekanan khusus untuk aksi ireversibel).

### Interaction
Untuk Pretest/Posttest: navigasi antar soal dapat dibatasi (tidak bisa mundur, opsional sesuai kebijakan penelitian) untuk menjaga validitas data; untuk Quiz biasa, navigasi bebas maju-mundur.

### User Journey
Dashboard/Materi → notifikasi test tersedia → halaman instruksi → mulai sesi → jawab soal → submit dengan konfirmasi tegas → halaman hasil (Bagian 10).

### Navigation
Selama sesi aktif, navigasi keluar sistem (sidebar/logout) sebaiknya diberi peringatan agar tidak kehilangan progres sesi yang sedang berjalan.

### Animation
Transisi antar soal slide horizontal halus; timer (jika ada) berubah warna (kuning→merah) mendekati waktu habis sebagai isyarat visual, bukan hanya angka.

### Micro Interaction
Tombol "Mulai" pada instruksi memiliki sedikit delay/animasi loading agar terasa "memulai sesi resmi", bukan transisi instan yang terasa remeh.

### Color
Untuk Pretest/Posttest, gunakan aksen warna yang sedikit lebih formal/tegas (mis. Primary lebih pekat) dibanding Quiz biasa yang lebih ringan — membedakan bobot psikologis kedua jenis penilaian.

### Typography
Instruksi dan peringatan ireversibilitas ditulis tegas namun tetap sopan, ukuran cukup besar agar tidak terlewat.

### Spacing
Halaman instruksi diberi ruang bernafas agar siswa membaca aturan dengan tenang sebelum mulai (mengurangi kesalahan karena tergesa).

### Grid System
Single column terpusat, konsisten dengan Latihan namun dengan elemen tambahan (timer, indikator jumlah soal).

### Icon
Ikon jam (timer), ikon peringatan (⚠) untuk aturan satu-kali-kerjakan.

### Responsive Behaviour

**Desktop:** Layout terpusat dengan card sedang, timer terlihat jelas di pojok atas.
**Tablet:** Serupa desktop dengan penyesuaian lebar card.
**Mobile:** Timer tetap terlihat (sticky di atas), opsi jawaban full-width untuk kemudahan tap tanpa salah pilih.

### Empty State
Tidak relevan (halaman ini hanya muncul saat sesi tersedia).

### Loading State
Skeleton pada halaman instruksi saat memuat detail bank soal; loading state jelas saat submit diproses ("Mengirim jawaban...").

### Error State
Jika koneksi terputus di tengah sesi: sistem menyimpan jawaban yang sudah terisi secara lokal/berkala dan menampilkan pesan pemulihan saat koneksi kembali — krusial untuk NFR Reliability (lihat 01-ARCHITECTURE.md Bagian 6).

### Accessibility
Timer disertai indikator non-warna (angka jelas, bukan hanya warna) agar tetap dapat dipahami pengguna dengan gangguan penglihatan warna.

### Design Notes
Ini adalah halaman paling kritis secara data penelitian — UX harus meminimalkan kesalahan tidak sengaja (submit tanpa sadar, kehilangan progres) melalui konfirmasi tegas dan penyimpanan progresif.

---

## 10. HALAMAN HASIL

### Purpose
Menampilkan hasil belajar siswa (skor latihan/quiz/pretest/posttest) secara jelas dan memotivasi, bukan menghakimi.

### Target User
Siswa (lihat hasil pribadi).

### User Goal
Memahami capaian belajar dan area yang perlu diperbaiki.

### Wireframe ASCII

```
┌──────────────────────────────────────────────────┐
│  Hasil Quiz: Bab 2 - Pecahan                          │
│                                                     │
│         [Skor Besar: 80/100]                           │
│         "Kerja bagus! 👏"                              │
│                                                     │
│  Rincian:                                              │
│  ✓ Benar: 8 soal      ✗ Salah: 2 soal                    │
│                                                     │
│  [Lihat Pembahasan]     [Kembali ke Materi]              │
└──────────────────────────────────────────────────┘
```

### Layout Structure
Hero score di tengah atas (fokus utama), diikuti rincian statistik, opsi lihat pembahasan (jika kebijakan penelitian mengizinkan), CTA lanjutan.

### Components
Score Display (besar, dengan animasi count-up), Encouragement Message, Stat Breakdown, Review/Pembahasan List (opsional per kebijakan), Action Buttons.

### Interaction
Klik "Lihat Pembahasan" membuka daftar soal dengan penanda benar/salah dan penjelasan (jika fitur ini diaktifkan — untuk Pretest/Posttest kemungkinan pembahasan disembunyikan sesuai kebutuhan riset agar tidak bias data lanjutan).

### User Journey
Submit sesi → halaman hasil tampil → siswa melihat skor → (opsional) review pembahasan → kembali ke alur belajar.

### Navigation
CTA jelas untuk langkah selanjutnya (lanjut materi berikutnya / kembali dashboard).

### Animation
Skor melakukan count-up animation dari 0 ke nilai akhir; ikon/emoji ekspresif muncul sesuai rentang skor (encouraging untuk semua rentang, tidak ada pesan negatif untuk skor rendah).

### Micro Interaction
Confetti/partikel ringan (opsional, halus) untuk skor tinggi sebagai elemen gamifikasi ringan, tidak berlebihan.

### Color
Warna skor dapat sedikit adaptif (hijau untuk baik, amber untuk cukup) namun pesan teks tetap suportif di semua rentang — tidak menggunakan merah tegas untuk skor rendah siswa (menghindari efek psikologis negatif).

### Typography
Angka skor sangat dominan secara ukuran (fokus emosional utama halaman).

### Spacing
Hero score diberi ruang besar dan terpusat, rincian di bawah lebih compact.

### Grid System
Single column terpusat.

### Icon
Ikon ekspresif kontekstual (bintang, tepuk tangan) — bukan ikon generik grafik.

### Responsive Behaviour

**Desktop:** Layout terpusat dengan card lebar sedang, breakdown statistik dua kolom.
**Tablet:** Serupa dengan penyesuaian lebar.
**Mobile:** Semua elemen stack vertikal, skor tetap menjadi fokus visual utama.

### Empty State
Tidak relevan (halaman muncul setelah ada hasil).

### Loading State
Skeleton/spinner singkat "Menghitung hasil..." sebelum skor ditampilkan (memberi jeda psikologis yang wajar, bukan instan tiba-tiba).

### Error State
Jika skor gagal dihitung/dimuat: pesan "Hasil sedang diproses, silakan cek kembali di halaman Hasil" dengan link ke riwayat.

### Accessibility
Skor dan status disampaikan dalam teks eksplisit, bukan hanya melalui warna atau ikon.

### Design Notes
Nada halaman ini sangat penting secara psikologis — untuk siswa SMP, cara skor disampaikan memengaruhi motivasi belajar lanjutan. Selalu suportif, tidak pernah menghakimi.

---

## 11. HALAMAN LAPORAN

### Purpose
Memberi guru pandangan agregat dan granular atas hasil belajar siswa, khususnya perbandingan pretest–posttest untuk kebutuhan penelitian.

### Target User
Guru.

### User Goal
Menganalisis efektivitas pembelajaran secara cepat dan mendalam saat dibutuhkan.

### Wireframe ASCII

```
┌────────┬─────────────────────────────────────────┐
│ Sidebar │  Laporan Hasil Belajar                     │
│         │  [Filter: Kelas ▾] [Filter: Periode ▾]      │
│         │                                            │
│         │  Ringkasan Pretest vs Posttest               │
│         │  ┌────────────────────────────────────┐   │
│         │  │  [Grafik perbandingan rata-rata]      │   │
│         │  └────────────────────────────────────┘   │
│         │                                            │
│         │  Tabel Detail per Siswa                      │
│         │  ┌────────────────────────────────────┐   │
│         │  │Nama | Pretest | Posttest | Peningkatan│   │
│         │  │Siswa A | 60 | 85 | +25                │   │
│         │  │Siswa B | 55 | 70 | +15                │   │
│         │  └────────────────────────────────────┘   │
└────────┴─────────────────────────────────────────┘
```

### Layout Structure
Filter bar di atas, ringkasan visual (chart) di tengah, tabel data granular di bawah — pola klasik dashboard analitik.

### Components
Filter Dropdown (Kelas, Periode), Comparison Chart, Data Table (sortable), Export/Detail Button per baris (opsional MVP), Empty/Loading states.

### Interaction
Filter mengubah data chart & tabel secara real-time; klik baris siswa membuka detail individual (riwayat lengkap sesi).

### User Journey
Dashboard Guru → Laporan → filter kelas/periode → analisis chart perbandingan → telaah tabel detail → (opsional) buka detail satu siswa.

### Navigation
Breadcrumb sederhana jika masuk ke detail siswa individual, tombol kembali ke ringkasan.

### Animation
Chart transisi halus saat filter berubah (bukan reload mendadak); tabel fade saat data diperbarui.

### Micro Interaction
Header tabel dapat diklik untuk sorting dengan indikator arah panah; hover baris tabel memberi highlight.

### Color
Chart menggunakan dua warna berbeda jelas untuk Pretest vs Posttest (kontras cukup agar mudah dibaca sebagai data ilmiah, bukan hanya estetika).

### Typography
Data numerik dalam tabel menggunakan font tabular agar sejajar rapi, memudahkan pemindaian visual cepat oleh guru.

### Spacing
Tabel dengan padding baris cukup agar mudah dibaca dalam sesi analisis panjang.

### Grid System
Full-width content area di dalam layout sidebar; tabel responsif dengan scroll horizontal jika kolom banyak.

### Icon
Ikon panah naik/turun untuk indikator peningkatan/penurunan skor pada tabel.

### Responsive Behaviour

**Desktop:** Chart dan tabel full width dengan seluruh kolom terlihat.
**Tablet:** Chart menyesuaikan, tabel dapat scroll horizontal jika perlu.
**Mobile:** Chart disederhanakan (ringkasan angka saja jika chart penuh terlalu padat), tabel berubah jadi card list per siswa agar tetap terbaca tanpa scroll horizontal yang sulit.

### Empty State
Belum ada data pretest/posttest: pesan "Belum ada data untuk periode/kelas ini."

### Loading State
Skeleton chart dan skeleton baris tabel saat data dimuat/difilter.

### Error State
Gagal memuat laporan: pesan jelas dengan tombol "Muat Ulang Laporan", data terakhir yang berhasil dimuat tetap ditampilkan jika memungkinkan (stale-while-revalidate secara UX).

### Accessibility
Tabel data disusun sebagai elemen tabel semantik (bukan div biasa) agar dapat dinavigasi screen reader; chart didampingi ringkasan teks.

### Design Notes
Halaman ini adalah antarmuka paling "ilmiah" dalam aplikasi — kejelasan data harus diutamakan di atas estetika dekoratif; ini adalah alat kerja guru/peneliti, bukan halaman promosi.

---

## 12. HALAMAN PROFILE

### Purpose
Menampilkan dan mengelola identitas dasar pengguna (Guru/Siswa).

### Target User
Guru dan Siswa.

### User Goal
Melihat/mengubah informasi diri dengan mudah.

### Wireframe ASCII

```
┌──────────────────────────────────────────────────┐
│           [Avatar]                                   │
│           Nama Pengguna                                │
│           Role: Siswa / Guru                            │
│                                                     │
│  [ Nama Lengkap    ]                                   │
│  [ Email            ]                                   │
│  [ Sekolah/Kelas    ]  (khusus siswa, read-only)          │
│                                                     │
│              [ Simpan Perubahan ]                       │
└──────────────────────────────────────────────────┘
```

### Layout Structure
Card terpusat dengan avatar di atas, form informasi di bawahnya — layout sederhana single-column.

### Components
Avatar Upload, Form Field (Nama, Email), Read-only Info Field (Kelas untuk siswa), Save Button.

### Interaction
Klik avatar membuka opsi ganti foto (upload ke Supabase Storage); perubahan field memunculkan tombol "Simpan" aktif.

### User Journey
Sidebar/Topbar → Profil → lihat/ubah data → simpan → notifikasi sukses.

### Navigation
Dapat diakses dari topbar (avatar/nama) di semua halaman.

### Animation
Avatar upload menampilkan preview instan sebelum disimpan; toast sukses muncul dengan slide-in singkat.

### Micro Interaction
Tombol simpan menampilkan state loading singkat lalu berubah jadi centang sesaat sebagai konfirmasi visual.

### Color
Netral, mengikuti palet dasar tanpa aksen berlebihan — halaman fungsional, bukan halaman promosi.

### Typography
Label field jelas, nama pengguna ditampilkan dengan penekanan sedang di bagian atas card.

### Spacing
Form field diberi jarak vertikal cukup untuk kemudahan tap di mobile.

### Grid System
Single column, max-width form ±480px.

### Icon
Ikon kamera kecil pada overlay avatar untuk indikasi dapat diubah.

### Responsive Behaviour

**Desktop:** Card terpusat dengan lebar sedang.
**Tablet:** Serupa, sedikit lebih ramping.
**Mobile:** Card full-width dengan padding aman, avatar tetap terpusat di atas.

### Empty State
Avatar kosong menampilkan inisial nama sebagai placeholder (bukan gambar generik).

### Loading State
Skeleton pada avatar dan field saat data profil dimuat pertama kali.

### Error State
Gagal simpan: pesan error inline dekat tombol simpan, data form tidak hilang/reset.

### Accessibility
Form label terhubung eksplisit ke input, upload avatar dapat diakses via keyboard.

### Design Notes
Halaman ini harus sederhana dan cepat — bukan area eksplorasi, murni fungsional.

---

## 13. HALAMAN SETTINGS

### Purpose
Pengaturan akun tingkat sistem (ubah password, preferensi dasar).

### Target User
Guru dan Siswa.

### User Goal
Mengatur keamanan akun dan preferensi dengan mudah.

### Wireframe ASCII

```
┌──────────────────────────────────────────────────┐
│  Pengaturan Akun                                      │
│                                                     │
│  Keamanan                                             │
│  [ Password Saat Ini    ]                              │
│  [ Password Baru        ]                              │
│  [ Konfirmasi Password  ]                              │
│              [ Ubah Password ]                          │
│                                                     │
│  Preferensi                                            │
│  ( ) Mode Terang   ( ) Mode Gelap  (jika didukung)       │
│                                                     │
│  [ Keluar dari Akun ]  (danger zone)                    │
└──────────────────────────────────────────────────┘
```

### Layout Structure
Section-based single column: Keamanan → Preferensi → Danger Zone (logout/hapus akun jika relevan), dipisah jelas secara visual.

### Components
Password Change Form, Toggle/Radio Preference, Danger Zone Button (logout), Confirmation Modal untuk aksi sensitif.

### Interaction
Ubah password memerlukan validasi password saat ini; klik "Keluar dari Akun" memicu modal konfirmasi sebelum eksekusi.

### User Journey
Profil/Topbar → Settings → ubah password bila perlu → simpan → (opsional) logout.

### Navigation
Dapat diakses dari sidebar item "Settings" atau dropdown topbar.

### Animation
Section danger zone tidak menggunakan animasi playful — tetap netral untuk menekankan keseriusan aksi.

### Micro Interaction
Validasi kekuatan password (indikator sederhana lemah/sedang/kuat) muncul saat mengetik password baru.

### Color
Section danger zone menggunakan aksen warna Error tipis pada border/tombol untuk membedakan tingkat risiko aksi.

### Typography
Section header jelas membedakan kategori pengaturan (Keamanan vs Preferensi vs Danger Zone).

### Spacing
Setiap section dipisah garis pembatas tipis + spacing vertikal jelas agar tidak tertukar konteks.

### Grid System
Single column, max-width ±560px.

### Icon
Ikon gembok (keamanan), ikon matahari/bulan (mode terang/gelap jika didukung), ikon keluar (logout).

### Responsive Behaviour

**Desktop:** Card settings dengan lebar sedang, section tersusun rapi vertikal.
**Tablet:** Serupa dengan penyesuaian lebar.
**Mobile:** Full-width dengan section tetap terpisah jelas, tombol full-width untuk kemudahan tap.

### Empty State
Tidak relevan.

### Loading State
Tombol "Ubah Password" menampilkan spinner saat proses submit.

### Error State
Password saat ini salah: pesan error jelas di bawah field terkait, tidak menghapus input lain yang sudah diisi.

### Accessibility
Toggle preferensi dapat dioperasikan via keyboard, label form jelas dan terhubung ke input.

### Design Notes
Danger zone (logout, dsb.) harus secara visual terpisah tegas dari pengaturan biasa agar pengguna tidak salah klik — prinsip standar UX untuk aksi berisiko/ireversibel.

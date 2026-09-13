/**
 * KANUM – Materi Detail Page Logic
 */
(function () {
  'use strict';

    // ===================== DATA MATERI =====================
    const chapters = {

      1: {
        label: 'Bab 1', title: 'Bilangan Real', time: '28 menit', level: 'Dasar',
        intro: 'Memahami berbagai jenis bilangan, operasi hitung, dan faktorisasi prima melalui konteks pembelajaran Fase D.',
        hero: '../Asset/Images/motif_kain_kajang.png',
        tujuan: [
          'Membaca, menulis, dan membandingkan berbagai jenis bilangan (bulat, rasional, irasional)',
          'Menerapkan operasi aritmetika pada bilangan real',
          'Memberikan estimasi yang masuk akal dalam pemecahan masalah'
        ],
        prev: 8, next: 2,
        sections: [
          {
            id: 'bilangan-bulat', icon: 'numbers', title: 'Bilangan Bulat', content: `
        <p class="text-on-surface-variant leading-relaxed">Bilangan bulat adalah kumpulan atau himpunan bilangan yang nilainya bulat. Dalam matematika himpunan bilangan bulat dilambangkan dengan <strong>Z</strong>.</p>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          ${['Bilangan Cacah', 'Bilangan Nol', 'Bilangan Bulat Positif', 'Bilangan Bulat Negatif', 'Bilangan Ganjil', 'Bilangan Genap', 'Bilangan Prima', 'Bilangan Komposit'].map(j => `<div class="bg-primary-fixed/30 text-primary text-xs font-semibold px-3 py-2 rounded-xl text-center">${j}</div>`).join('')}
        </div>`
          },
          {
            id: 'menentukan-jenis', icon: 'checklist', title: 'Cara Menentukan Jenis Bilangan', content: `
        <h4 class="font-bold text-primary mb-2">Menentukan Bilangan Genap atau Ganjil</h4>
        <p class="text-on-surface-variant text-sm mb-2">Periksa sisa pembagian dengan 2.</p>
        <ul class="text-sm space-y-1 text-on-surface-variant mb-4">
          <li>• Jika habis dibagi 2 → <strong class="text-primary">Bilangan Genap</strong></li>
          <li>• Jika bersisa 1 → <strong class="text-primary">Bilangan Ganjil</strong></li>
        </ul>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh</p>
          <p class="text-sm">18 ÷ 2 = 9 → <strong>Genap</strong></p>
          <p class="text-sm">25 ÷ 2 = 12 sisa 1 → <strong>Ganjil</strong></p>
        </div>
        <h4 class="font-bold text-primary mb-2">Menentukan Bilangan Prima</h4>
        <ol class="text-sm space-y-1 text-on-surface-variant mb-3 list-decimal list-inside">
          <li>Bilangan harus lebih besar dari 1</li>
          <li>Hitung banyak faktor yang dimiliki</li>
          <li>Jika hanya memiliki faktor <strong>1</strong> dan dirinya sendiri, maka termasuk bilangan prima</li>
        </ol>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh</p>
          <p class="text-sm">13 → faktor: 1 dan 13 → <strong>Prima</strong></p>
          <p class="text-sm">15 → faktor: 1, 3, 5, 15 → <strong>Bukan prima</strong></p>
        </div>
        <h4 class="font-bold text-primary mb-2">Menentukan Bilangan Komposit</h4>
        <p class="text-sm text-on-surface-variant mb-2">Jika suatu bilangan memiliki <strong>lebih dari dua faktor</strong>, maka bilangan tersebut adalah komposit.</p>
        <div class="example-card bg-surface-container-low rounded-xl p-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh</p>
          <p class="text-sm">18 → faktor: 1, 2, 3, 6, 9, 18 → <strong>Komposit</strong></p>
        </div>`
          },
          {
            id: 'faktorisasi', icon: 'account_tree', title: 'Faktorisasi Prima', content: `
        <p class="text-on-surface-variant text-sm mb-4">Faktorisasi prima adalah proses menguraikan suatu bilangan menjadi hasil perkalian bilangan-bilangan prima.</p>
        <div class="formula-box rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-primary uppercase mb-2">Contoh: Faktorisasi prima dari 60</p>
          <p class="text-sm text-on-surface-variant">60 = 2 × 2 × 3 × 5 = <strong class="text-primary text-base">2² × 3 × 5</strong></p>
        </div>
        <img src="../Asset/Images/Faktorisasi-Prima.png" alt="Ilustrasi faktorisasi" class="w-full rounded-xl object-cover opacity-80 mb-2" style="aspect-ratio: 16 / 5; object-fit: cover;"/>`
          },
          {
            id: 'operasi', icon: 'calculate', title: 'Operasi pada Bilangan Real', content: `
        <p class="text-on-surface-variant text-sm mb-4">Operasi dasar pada bilangan real meliputi penjumlahan, pengurangan, perkalian, pembagian, perpangkatan, dan akar.</p>

        <h4 class="font-bold text-primary mb-2">1. Penjumlahan</h4>
        <div class="bg-surface-container rounded-xl p-3 mb-3 text-sm">
          <p class="text-on-surface-variant mb-1"><strong>Bilangan bertanda sama:</strong> jumlahkan nilainya, pertahankan tanda</p>
          <p>7 + 5 = <strong>12</strong> &nbsp;|&nbsp; (−8) + (−4) = <strong>−12</strong></p>
          <p class="text-on-surface-variant mt-2 mb-1"><strong>Bilangan berbeda tanda:</strong> kurangkan, gunakan tanda nilai mutlak terbesar</p>
          <p>9 + (−4) = <strong>5</strong> &nbsp;|&nbsp; (−12) + 7 = <strong>−5</strong></p>
        </div>

        <h4 class="font-bold text-primary mb-2">2. Pengurangan</h4>
        <div class="formula-box rounded-xl p-3 mb-3 text-sm">
          <p class="font-mono text-primary font-bold">a − b = a + (−b)</p>
        </div>
        <div class="bg-surface-container rounded-xl p-3 mb-3 text-sm">
          <p>8 − 3 = <strong>5</strong> &nbsp;|&nbsp; 5 − (−2) = 5 + 2 = <strong>7</strong> &nbsp;|&nbsp; (−7) − 4 = <strong>−11</strong></p>
        </div>

        <h4 class="font-bold text-primary mb-2">3. Perkalian</h4>
        <div class="overflow-x-auto mb-3">
          <table class="text-sm w-full border-collapse">
            <thead><tr class="bg-primary text-on-primary"><th class="px-4 py-2 text-left rounded-tl-lg">Tanda</th><th class="px-4 py-2 text-left rounded-tr-lg">Hasil</th></tr></thead>
            <tbody class="divide-y divide-outline-variant">
              <tr class="bg-surface-container-low"><td class="px-4 py-2">(+) × (+)</td><td class="px-4 py-2 font-bold text-primary">+</td></tr>
              <tr><td class="px-4 py-2">(+) × (−)</td><td class="px-4 py-2 font-bold text-secondary">−</td></tr>
              <tr class="bg-surface-container-low"><td class="px-4 py-2">(−) × (+)</td><td class="px-4 py-2 font-bold text-secondary">−</td></tr>
              <tr><td class="px-4 py-2">(−) × (−)</td><td class="px-4 py-2 font-bold text-primary">+</td></tr>
            </tbody>
          </table>
        </div>
        <p class="text-sm text-on-surface-variant mb-4">Contoh: 6 × 4 = 24 &nbsp;|&nbsp; (−5) × 3 = −15 &nbsp;|&nbsp; (−8) × (−2) = 16</p>

        <h4 class="font-bold text-primary mb-2">4. Pembagian</h4>
        <p class="text-sm text-on-surface-variant mb-2">Aturan tanda sama seperti perkalian.</p>
        <div class="note-box rounded-xl p-3 mb-3 text-sm"><p>⚠️ Bilangan tidak dapat dibagi dengan nol.</p></div>

        <h4 class="font-bold text-primary mb-2">5. Perpangkatan</h4>
        <div class="formula-box rounded-xl p-3 mb-3">
          <p class="font-mono text-primary font-bold">aⁿ = a × a × a × ⋯ (sebanyak n kali)</p>
        </div>
        <p class="text-sm text-on-surface-variant mb-4">3² = 9 &nbsp;|&nbsp; 5³ = 125 &nbsp;|&nbsp; (−2)² = 4 &nbsp;|&nbsp; (−2)³ = −8</p>

        <h4 class="font-bold text-primary mb-2">6. Akar Pangkat</h4>
        <p class="text-sm text-on-surface-variant mb-3">Akar pangkat merupakan kebalikan dari perpangkatan.</p>
        <p class="text-sm bg-surface-container rounded-xl p-3">√25 = 5 &nbsp;|&nbsp; √64 = 8 &nbsp;|&nbsp; ∛27 = 3</p>`
          },
          {
            id: 'urutan-operasi', icon: 'sort', title: 'Urutan Operasi Hitung', content: `
        <p class="text-on-surface-variant text-sm mb-4">Agar hasil perhitungan benar, operasi dilakukan sesuai urutan berikut:</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          ${[['1', 'Kurung', '(  )', 'bg-secondary'], ['2', 'Pangkat / Akar', 'xⁿ √x', 'bg-tertiary'], ['3', 'Kali / Bagi', '× ÷', 'bg-primary-container'], ['4', 'Tambah / Kurang', '+ −', 'bg-outline']].map(([n, l, s, c]) => `
          <div class="bg-surface-container rounded-xl p-3 text-center border border-outline-variant">
            <div class="w-8 h-8 ${c} text-on-primary rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1">${n}</div>
            <div class="font-bold text-primary text-xs">${l}</div>
            <div class="text-on-surface-variant text-xs mt-0.5">${s}</div>
          </div>`).join('')}
        </div>
        <div class="highlight-box rounded-xl p-4">
          <p class="text-xs font-bold text-tertiary uppercase mb-2">Aturan KPKP</p>
          <p class="text-sm font-bold text-on-surface">Kurung – Pangkat – Kali/Bagi – Tambah/Kurang</p>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mt-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh</p>
          <p class="text-sm">8 + 3 × 4 = 8 + 12 = <strong>20</strong></p>
          <p class="text-sm">(8 + 3) × 4 = 11 × 4 = <strong>44</strong></p>
        </div>`
          }
        ]
      },

      2: {
        label: 'Bab 2', title: 'Rasio & Perbandingan', time: '30 menit', level: 'Menengah',
        intro: 'Memahami dan menggunakan konsep rasio, skala, proporsi, dan laju perubahan dalam konteks kehidupan.',
        hero: '../Asset/Images/pengukuran_tradisional_kajang2.png',
        tujuan: [
          'Memahami dan menggunakan faktorisasi prima dan konsep rasio',
          'Menyelesaikan masalah skala dan proporsi',
          'Menggunakan rasio dalam literasi finansial'
        ],
        prev: 1, next: 3,
        sections: [
          {
            id: 'pengertian-rasio', icon: 'compare', title: 'Pengertian Rasio', content: `
        <p class="text-on-surface-variant text-sm leading-relaxed mb-4">Rasio adalah perbandingan antara dua besaran atau lebih yang memiliki satuan yang sama. Rasio menunjukkan hubungan atau perbandingan nilai suatu besaran terhadap besaran lainnya.</p>
        <div class="formula-box rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-primary uppercase mb-2">Bentuk Penulisan Rasio</p>
          <div class="flex gap-4 flex-wrap text-sm">
            <span class="bg-primary text-on-primary px-3 py-1 rounded-full font-bold">a : b</span>
            <span class="bg-primary text-on-primary px-3 py-1 rounded-full font-bold">a/b</span>
            <span class="bg-primary text-on-primary px-3 py-1 rounded-full font-bold">"a banding b"</span>
          </div>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh</p>
          <p class="text-sm text-on-surface-variant">Dalam sebuah kelas terdapat 12 siswa laki-laki dan 18 siswa perempuan.</p>
          <p class="text-sm mt-1">Rasio laki-laki : perempuan = <strong>12 : 18</strong></p>
          <p class="text-sm">Rasio perempuan : laki-laki = <strong>18 : 12</strong></p>
        </div>`
          },
          {
            id: 'menyederhanakan', icon: 'compress', title: 'Menyederhanakan Rasio', content: `
        <p class="text-sm text-on-surface-variant mb-3">Rasio dapat disederhanakan dengan membagi kedua bilangan menggunakan <strong>Faktor Persekutuan Terbesar (FPB)</strong>.</p>
        <ol class="text-sm space-y-1 text-on-surface-variant list-decimal list-inside mb-4">
          <li>Tentukan FPB dari kedua bilangan</li>
          <li>Bagi kedua bilangan dengan FPB tersebut</li>
          <li>Peroleh rasio paling sederhana</li>
        </ol>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh: Sederhanakan 24 : 36</p>
          <p class="text-sm">FPB dari 24 dan 36 adalah <strong>12</strong></p>
          <p class="text-sm">24 : 36 = (24 ÷ 12) : (36 ÷ 12) = <strong class="text-primary">2 : 3</strong></p>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Menggunakan Faktorisasi Prima: Sederhanakan 48 : 72</p>
          <p class="text-sm">48 = 2⁴ × 3 &nbsp;|&nbsp; 72 = 2³ × 3²</p>
          <p class="text-sm">FPB = 2³ × 3 = 24</p>
          <p class="text-sm">48 : 72 = <strong class="text-primary">2 : 3</strong></p>
        </div>`
          },
          {
            id: 'proporsi', icon: 'balance', title: 'Proporsi (Rasio Senilai)', content: `
        <p class="text-sm text-on-surface-variant mb-3">Proporsi adalah dua rasio yang memiliki nilai sama. Secara umum: <strong>a : b = c : d</strong></p>
        <div class="formula-box rounded-xl p-4 mb-4">
          <p class="font-mono text-primary font-bold text-sm">a/b = c/d &nbsp;⟺&nbsp; a × d = b × c</p>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Menentukan Nilai yang Belum Diketahui</p>
          <p class="text-sm">Jika 3 : 5 = 12 : x</p>
          <p class="text-sm">Kalikan silang: 3x = 60 → x = <strong>20</strong></p>
        </div>
        <img src="../Asset/Images/pengukuran_tradisional_kajang.png" alt="Sistem pengukuran tradisional" class="w-full rounded-xl object-cover opacity-80 mb-2" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <p class="text-xs text-on-surface-variant text-center">Sistem pengukuran <em>hasta</em> masyarakat Kajang menggunakan konsep proporsi.</p>`
          },
          {
            id: 'perbandingan', icon: 'swap_horiz', title: 'Perbandingan Senilai & Berbalik Nilai', content: `
        <h4 class="font-bold text-primary mb-2">Perbandingan Senilai</h4>
        <p class="text-sm text-on-surface-variant mb-2">Jika suatu nilai bertambah, maka nilai lainnya juga bertambah secara sebanding.</p>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh</p>
          <p class="text-sm">Harga sebuah buku Rp8.000. Berapa harga 6 buku?</p>
          <p class="text-sm">Harga 6 buku = 6 × 8.000 = <strong class="text-primary">Rp48.000</strong></p>
        </div>
        <h4 class="font-bold text-primary mb-2">Perbandingan Berbalik Nilai</h4>
        <p class="text-sm text-on-surface-variant mb-2">Jika satu besaran bertambah, maka besaran lainnya berkurang.</p>
        <div class="example-card bg-surface-container-low rounded-xl p-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh</p>
          <p class="text-sm">4 pekerja menyelesaikan pekerjaan dalam 12 hari.</p>
          <p class="text-sm">Jika 8 pekerja: lama pekerjaan = (4 × 12) ÷ 8 = <strong class="text-primary">6 hari</strong></p>
        </div>`
          },
          {
            id: 'skala', icon: 'map', title: 'Skala', content: `
        <p class="text-sm text-on-surface-variant mb-3">Skala adalah perbandingan antara ukuran pada gambar atau peta dengan ukuran sebenarnya.</p>
        <div class="formula-box rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-primary uppercase mb-1">Rumus Skala</p>
          <p class="font-mono text-primary font-bold">Skala = Ukuran pada peta : Ukuran sebenarnya</p>
          <p class="font-mono text-primary text-sm mt-1">Jarak sebenarnya = Jarak peta × Penyebut skala</p>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh Soal</p>
          <p class="text-sm">Skala peta 1 : 200.000. Jarak dua kota pada peta = 8 cm.</p>
          <p class="text-sm">Jarak sebenarnya = 8 × 200.000 = 1.600.000 cm = <strong class="text-primary">16 km</strong></p>
        </div>`
          },
          {
            id: 'literasi-finansial', icon: 'payments', title: 'Literasi Finansial', content: `
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">A. Membandingkan Harga Produk</p>
          <p class="text-sm text-on-surface-variant mb-2">Kemasan A: 500 gram — Rp18.000 &nbsp;|&nbsp; Kemasan B: 750 gram — Rp25.500</p>
          <p class="text-sm">Kemasan A: 18.000 ÷ 500 = Rp36/gram</p>
          <p class="text-sm">Kemasan B: 25.500 ÷ 750 = Rp34/gram</p>
          <p class="text-sm mt-2 font-bold text-primary">→ Kemasan B lebih ekonomis.</p>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">B. Komposisi Anggaran</p>
          <p class="text-sm text-on-surface-variant mb-2">Pendapatan Rp5.000.000/bulan. Rasio Kebutuhan : Tabungan : Hiburan = 6 : 3 : 1</p>
          <p class="text-sm">Total bagian = 10. Nilai per bagian = Rp500.000</p>
          <div class="mt-2 space-y-1 text-sm">
            <p>Kebutuhan: 6 × Rp500.000 = <strong>Rp3.000.000</strong></p>
            <p>Tabungan: 3 × Rp500.000 = <strong>Rp1.500.000</strong></p>
            <p>Hiburan: 1 × Rp500.000 = <strong>Rp500.000</strong></p>
          </div>
        </div>`
          }
        ]
      },

      3: {
        label: 'Bab 3', title: 'Pola & Aljabar', time: '25 menit', level: 'Dasar',
        intro: 'Mengenali, memprediksi, dan menggeneralisasi pola; menyatakan situasi ke dalam bentuk aljabar.',
        hero: '../Asset/Images/pola-aljabar.png',
        tujuan: [
          'Mengenali, memprediksi, dan menggeneralisasi pola dalam konfigurasi objek dan bilangan',
          'Menyatakan situasi ke dalam bentuk aljabar',
          'Menyederhanakan bentuk aljabar menggunakan sifat komutatif, asosiatif, distributif'
        ],
        prev: 2, next: 4,
        sections: [
          {
            id: 'pengertian-pola', icon: 'pattern', title: 'Pengertian Pola', content: `
        <p class="text-on-surface-variant text-sm leading-relaxed mb-4">Pola adalah susunan objek, gambar, atau bilangan yang mengikuti aturan tertentu dan berulang secara teratur. Dengan mengenali pola, kita dapat memprediksi suku berikutnya serta menemukan aturan yang membentuk pola tersebut.</p>
        <img src="../Asset/Images/motif_kainkajang.png" alt="Pola tenun Kajang" class="w-full rounded-xl object-cover opacity-80 mb-2" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <p class="text-xs text-on-surface-variant text-center mb-4">Motif tenun Tope Le'leng Kajang mengandung pola matematika berulang.</p>
        <h4 class="font-bold text-primary mb-2">Pola Bilangan</h4>
        <div class="bg-surface-container rounded-xl p-3 mb-3 text-sm space-y-1">
          <p>2, 4, 6, 8, 10, ... → bertambah <strong>2</strong> setiap suku</p>
          <p>3, 6, 9, 12, 15, ... → bertambah <strong>3</strong> setiap suku</p>
          <p>1, 4, 9, 16, 25, ... → pola bilangan <strong>kuadrat</strong></p>
        </div>`
          },
          {
            id: 'memprediksi', icon: 'trending_up', title: 'Memprediksi & Menggeneralisasi Pola', content: `
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Memprediksi Suku Berikutnya</p>
          <p class="text-sm">Pola: 5, 10, 15, 20, ...</p>
          <p class="text-sm">Setiap suku bertambah <strong>5</strong>, sehingga suku berikutnya: <strong class="text-primary">25</strong></p>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Menggeneralisasi Pola</p>
          <p class="text-sm">Pola: 2, 4, 6, 8, 10, ...</p>
          <p class="text-sm">Aturan umum: <strong>Suku ke-n = 2 × n</strong></p>
          <p class="text-sm mt-1">Suku ke-5 = 2 × 5 = 10 &nbsp;|&nbsp; Suku ke-10 = 2 × 10 = 20</p>
        </div>`
          },
          {
            id: 'bentuk-aljabar', icon: 'functions', title: 'Bentuk Aljabar', content: `
        <p class="text-sm text-on-surface-variant mb-4">Bentuk aljabar adalah bentuk matematika yang memuat <strong>variabel (huruf)</strong>, <strong>konstanta (bilangan)</strong>, dan <strong>operasi hitung</strong>.</p>
        <div class="grid grid-cols-2 gap-3 mb-4">
          ${[['Variabel', 'Lambang nilai belum diketahui', 'x, y, a, b'], ['Konstanta', 'Bilangan yang nilainya tetap', '5, −3, 10'], ['Koefisien', 'Bilangan yang mengalikan variabel', 'pada 4x, koefisiennya 4'], ['Suku', 'Bagian dipisah tanda + atau −', 'pada 3x+2y−5 ada 3 suku']].map(([t, d, c]) => `
          <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3">
            <p class="font-bold text-primary text-sm">${t}</p>
            <p class="text-xs text-on-surface-variant mt-1">${d}</p>
            <p class="text-xs font-mono text-secondary mt-1">${c}</p>
          </div>`).join('')}
        </div>`
          },
          {
            id: 'sifat-operasi', icon: 'rule', title: 'Sifat-Sifat Operasi Aljabar', content: `
        <div class="space-y-3">
          <div class="formula-box rounded-xl p-4">
            <p class="font-bold text-primary text-sm mb-1">1. Sifat Komutatif (Pertukaran)</p>
            <p class="font-mono text-sm">a + b = b + a &nbsp;|&nbsp; a × b = b × a</p>
            <p class="text-xs text-on-surface-variant mt-1">Contoh: 2x + 3 = 3 + 2x</p>
          </div>
          <div class="formula-box rounded-xl p-4">
            <p class="font-bold text-primary text-sm mb-1">2. Sifat Asosiatif (Pengelompokan)</p>
            <p class="font-mono text-sm">(a + b) + c = a + (b + c)</p>
            <p class="text-xs text-on-surface-variant mt-1">Contoh: (x + 2) + 5 = x + (2 + 5)</p>
          </div>
          <div class="formula-box rounded-xl p-4">
            <p class="font-bold text-primary text-sm mb-1">3. Sifat Distributif (Penyebaran)</p>
            <p class="font-mono text-sm">a(b + c) = ab + ac &nbsp;|&nbsp; a(b − c) = ab − ac</p>
            <div class="text-xs text-on-surface-variant mt-1 space-y-0.5">
              <p>Contoh: 3(x + 4) = 3x + 12</p>
              <p>2(5a − 3) = 10a − 6</p>
            </div>
          </div>
        </div>`
          }
        ]
      },

      4: {
        label: 'Bab 4', title: 'Relasi & Fungsi', time: '32 menit', level: 'Menengah',
        intro: 'Memahami relasi dan fungsi melalui konteks budaya Ammatoa Kajang — dari tokoh adat hingga sistem pengukuran tradisional.',
        hero: '../Asset/Images/hubunganantarmasyarakat.png',
        tujuan: [
          'Memahami pengertian relasi antara dua himpunan',
          'Menyatakan relasi dalam diagram panah, diagram Cartesius, dan himpunan pasangan berurutan',
          'Memahami pengertian fungsi serta menentukan domain, kodomain, dan range',
          'Membedakan relasi yang merupakan fungsi dan bukan fungsi',
          'Menerapkan konsep relasi dan fungsi dalam konteks budaya Ammatoa Kajang'
        ],
        prev: 3, next: 5,
        sections: [
          {
            id: 'pengantar', icon: 'connect_without_contact', title: 'Pengantar: Relasi dalam Budaya Kajang', content: `
        <div class="relative rounded-xl overflow-hidden mb-4">
          <img src="../Asset/Images/relasi-fungsi.png" alt="Proses menenun Kajang" class="w-full object-cover" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
          <div class="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex items-end p-4">
            <p class="text-white text-sm font-medium">Dalam budaya Kajang, setiap elemen saling berkaitan — seperti konsep relasi dalam matematika.</p>
          </div>
        </div>
        <p class="text-sm text-on-surface-variant leading-relaxed">Dalam kehidupan masyarakat Ammatoa Kajang, setiap tokoh adat memiliki tugas tertentu, setiap rumah memiliki bagian dengan fungsinya, dan setiap motif kain memiliki maknanya. Hubungan-hubungan inilah yang dalam matematika kita sebut <strong>relasi</strong> dan <strong>fungsi</strong>.</p>`
          },
          {
            id: 'pengertian-relasi', icon: 'hub', title: 'Pengertian Relasi', content: `
        <p class="text-sm text-on-surface-variant mb-4">Relasi adalah <strong>hubungan</strong> antara anggota suatu himpunan dengan anggota himpunan lainnya.</p>
        <div class="formula-box rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-primary uppercase mb-2">Definisi</p>
          <p class="text-sm">Jika A dan B adalah dua himpunan, maka <strong>relasi dari A ke B</strong> adalah aturan yang menghubungkan anggota-anggota himpunan A dengan anggota-anggota himpunan B.</p>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-3">Contoh Berbasis Budaya Kajang</p>
          <p class="text-sm font-semibold text-on-surface mb-2">Relasi "memiliki tugas" antara Tokoh Adat → Tugasnya</p>
          <div class="overflow-x-auto">
            <table class="text-sm w-full border-collapse">
              <thead><tr class="bg-primary text-on-primary"><th class="px-3 py-2 text-left rounded-tl-lg">Tokoh Adat (Himpunan A)</th><th class="px-3 py-2 text-left rounded-tr-lg">Tugas (Himpunan B)</th></tr></thead>
              <tbody class="divide-y divide-outline-variant">
                <tr class="bg-surface-container-low"><td class="px-3 py-2">Ammatoa</td><td class="px-3 py-2">Pemimpin adat & penegak Pasang ri Kajang</td></tr>
                <tr><td class="px-3 py-2">Galla Puto</td><td class="px-3 py-2">Urusan dalam kawasan adat</td></tr>
                <tr class="bg-surface-container-low"><td class="px-3 py-2">Galla Lombo</td><td class="px-3 py-2">Urusan luar kawasan adat</td></tr>
                <tr><td class="px-3 py-2">Sanro</td><td class="px-3 py-2">Dukun / penyembuh adat</td></tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-on-surface-variant mt-2">Relasi ini menghubungkan setiap tokoh adat dengan tugasnya.</p>
        </div>
        <img src="../Asset/Images/ammatoa_pemimpin_tertinggi.png" alt="Tokoh Adat Kajang" class="w-full rounded-xl object-cover opacity-80" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <p class="text-xs text-on-surface-variant text-center mt-1">Tokoh-tokoh adat Kajang memiliki relasi dengan tugas masing-masing.</p>`
          },
          {
            id: 'cara-menyatakan', icon: 'device_hub', title: 'Cara Menyatakan Relasi', content: `
        <p class="text-sm text-on-surface-variant mb-4">Relasi dapat dinyatakan dalam tiga cara:</p>

        <h4 class="font-bold text-primary mb-2">1. Diagram Panah</h4>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-3">Relasi: Motif Kain → Makna</p>
          <div class="flex gap-6 items-start">
            <div class="space-y-2 text-sm">
              <div class="bg-primary text-on-primary px-3 py-1 rounded-lg font-semibold">Himpunan A (Motif)</div>
              <p class="text-on-surface-variant">Motif Lurus</p>
              <p class="text-on-surface-variant">Motif Kotak</p>
              <p class="text-on-surface-variant">Motif Diagonal</p>
            </div>
            <div class="flex flex-col justify-center gap-3 mt-6">
              <p class="text-2xl text-primary">→</p>
              <p class="text-2xl text-primary">→</p>
              <p class="text-2xl text-primary">→</p>
            </div>
            <div class="space-y-2 text-sm">
              <div class="bg-secondary text-on-secondary px-3 py-1 rounded-lg font-semibold">Himpunan B (Makna)</div>
              <p class="text-on-surface-variant">Kejujuran (Kalambusang)</p>
              <p class="text-on-surface-variant">Keteraturan</p>
              <p class="text-on-surface-variant">Keseimbangan</p>
            </div>
          </div>
        </div>
        <div class="highlight-box rounded-xl p-3 mb-4">
          <p class="text-xs font-bold text-tertiary uppercase mb-1">Gunakan Gambar Aset</p>
          <p class="text-xs text-on-surface-variant">Ilustrasi diagram panah ditampilkan bersama motif kain berikut.</p>
        </div>
        <img src="../Asset/Images/relasi-motif-kajang.png" alt="Motif Kain Kajang" class="w-full rounded-xl object-cover opacity-85 mb-4" style="aspect-ratio: 16 / 5; object-fit: cover;"/>

        <h4 class="font-bold text-primary mb-2">2. Diagram Cartesius</h4>
        <p class="text-sm text-on-surface-variant mb-3">Pada diagram Cartesius, anggota himpunan A diletakkan pada sumbu horizontal dan anggota himpunan B pada sumbu vertikal. Titik (a, b) berarti a berelasi dengan b.</p>
        <img src="../Asset/Images/peta_desa_adat_ammatoa.png" alt="Peta Desa Adat Ammatoa" class="w-full rounded-xl object-cover opacity-80 mb-2" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <p class="text-xs text-on-surface-variant text-center mb-4">Seperti peta desa adat, diagram Cartesius memetakan hubungan antar dua himpunan.</p>

        <h4 class="font-bold text-primary mb-2">3. Himpunan Pasangan Berurutan</h4>
        <p class="text-sm text-on-surface-variant mb-3">Relasi dinyatakan sebagai himpunan pasangan berurutan {(a, b)} di mana a anggota A dan b anggota B.</p>
        <div class="example-card bg-surface-container-low rounded-xl p-4">
          <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh</p>
          <p class="text-sm font-mono">{(Motif Lurus, Kejujuran), (Motif Kotak, Keteraturan), (Motif Diagonal, Keseimbangan)}</p>
        </div>`
          },
          {
            id: 'fungsi', icon: 'function', title: 'Pengertian Fungsi', content: `
        <div class="relative rounded-xl overflow-hidden mb-4">
          <img src="../Asset/Images/rumah_adat_kajangFUNGSI.png" alt="Rumah Adat Kajang" class="w-full object-cover" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
          <div class="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex items-end p-4">
            <p class="text-white text-sm">Setiap rumah adat Kajang memiliki tepat satu fungsi utama — seperti fungsi dalam matematika.</p>
          </div>
        </div>
        <div class="formula-box rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-primary uppercase mb-2">Definisi Fungsi</p>
          <p class="text-sm">Fungsi adalah <strong>relasi khusus</strong> yang memasangkan setiap anggota himpunan asal (domain) dengan <strong>tepat satu</strong> anggota himpunan tujuan (kodomain).</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3">
            <div class="flex items-center gap-2 mb-1"><span class="material-symbols-outlined text-primary text-base">input</span><p class="font-bold text-primary text-sm">Domain</p></div>
            <p class="text-xs text-on-surface-variant">Himpunan nilai masukan (himpunan asal)</p>
          </div>
          <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3">
            <div class="flex items-center gap-2 mb-1"><span class="material-symbols-outlined text-secondary text-base">output</span><p class="font-bold text-secondary text-sm">Kodomain</p></div>
            <p class="text-xs text-on-surface-variant">Himpunan nilai yang mungkin menjadi keluaran</p>
          </div>
          <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3">
            <div class="flex items-center gap-2 mb-1"><span class="material-symbols-outlined text-tertiary text-base">target</span><p class="font-bold text-tertiary text-sm">Range</p></div>
            <p class="text-xs text-on-surface-variant">Himpunan nilai keluaran yang benar-benar dipasangkan</p>
          </div>
        </div>
        <img src="../Asset/Images/DOMAIN-KODOMAIN.png" alt="Pengukuran Tradisional Kajang" class="w-full rounded-xl object-cover opacity-80 mb-2" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <p class="text-xs text-on-surface-variant text-center">Sistem pengukuran <em>hasta</em>: setiap jumlah hasta memiliki tepat satu nilai dalam cm. Ini adalah fungsi!</p>`
          },
          {
            id: 'fungsi-bukan-fungsi', icon: 'compare_arrows', title: 'Fungsi vs Bukan Fungsi', content: `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="border-2 border-primary rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary">check_circle</span><p class="font-bold text-primary text-sm">Fungsi ✓</p></div>
            <p class="text-xs text-on-surface-variant mb-3">Setiap anggota domain dipasangkan dengan <strong>tepat satu</strong> anggota kodomain.</p>
            <div class="example-card bg-surface-container-low rounded-xl p-3">
              <p class="text-xs font-bold text-secondary uppercase mb-1">Contoh</p>
              <p class="text-xs">Setiap alat tenun → tepat satu fungsi tertentu</p>
              <p class="text-xs">Pappakang → Alat dasar tenun</p>
              <p class="text-xs">Panggepe → Penahan benang</p>
              <p class="text-xs">Balira → Pengatur ketegangan</p>
            </div>
          </div>
          <div class="border-2 border-secondary rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-secondary">cancel</span><p class="font-bold text-secondary text-sm">Bukan Fungsi ✗</p></div>
            <p class="text-xs text-on-surface-variant mb-3">Ada anggota domain yang dipasangkan dengan <strong>lebih dari satu</strong> anggota kodomain.</p>
            <div class="bg-surface-container-low rounded-xl p-3">
              <p class="text-xs font-bold text-secondary uppercase mb-1">Contoh bukan fungsi</p>
              <p class="text-xs">Satu kampung adat → dua wilayah berbeda (tidak mungkin dalam realitas aturan adat yang ketat)</p>
            </div>
          </div>
        </div>
        <div class="highlight-box rounded-xl p-4">
          <p class="text-xs font-bold text-tertiary uppercase mb-1">Catatan Penting</p>
          <p class="text-sm text-on-surface-variant">Semua fungsi adalah relasi, tetapi tidak semua relasi adalah fungsi. Syarat fungsi: setiap anggota domain harus dipasangkan dengan <strong>tepat satu</strong> anggota kodomain.</p>
        </div>`
          },
          {
            id: 'contoh-soal', icon: 'quiz', title: 'Contoh Soal & Pembahasan', content: `
        <img src="../Asset/Images/ritual_adat_kajang.png" alt="Ritual Adat Kajang" class="w-full rounded-xl object-cover opacity-80 mb-4" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <div class="space-y-4">
          <div class="example-card bg-surface-container-low rounded-xl p-4">
            <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh 1</p>
            <p class="text-sm font-semibold mb-1">Diketahui:</p>
            <p class="text-sm text-on-surface-variant">Himpunan A = {Pappakang, Panggepe, Balira, Tumpa}<br/>Himpunan B = {Alat dasar tenun, Penahan benang, Pengatur ketegangan, Alat penenun}<br/>Relasi: "memiliki fungsi"</p>
            <p class="text-sm font-semibold mt-3 mb-1">Nyatakan dalam himpunan pasangan berurutan:</p>
            <p class="text-sm font-mono text-primary">{(Pappakang, Alat dasar tenun), (Panggepe, Penahan benang), (Balira, Pengatur ketegangan), (Tumpa, Alat penenun)}</p>
            <p class="text-sm mt-2 font-bold text-primary">→ Ini adalah <span class="underline">fungsi</span> karena setiap alat tepat satu fungsi.</p>
          </div>
          <div class="example-card bg-surface-container-low rounded-xl p-4">
            <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh 2</p>
            <p class="text-sm font-semibold mb-1">Diketahui fungsi f(x) = 2x + 1, domain = {1, 2, 3}</p>
            <p class="text-sm font-semibold mt-2 mb-1">Penyelesaian:</p>
            <div class="text-sm space-y-0.5">
              <p>f(1) = 2(1) + 1 = <strong class="text-primary">3</strong></p>
              <p>f(2) = 2(2) + 1 = <strong class="text-primary">5</strong></p>
              <p>f(3) = 2(3) + 1 = <strong class="text-primary">7</strong></p>
            </div>
            <p class="text-sm mt-2">Domain = {1, 2, 3} &nbsp;|&nbsp; Range = {3, 5, 7}</p>
          </div>
          <div class="example-card bg-surface-container-low rounded-xl p-4">
            <p class="text-xs font-bold text-secondary uppercase mb-2">Contoh 3 — Sistem Pengukuran Hasta</p>
            <p class="text-sm text-on-surface-variant mb-2">Sistem <em>hasta</em>: 1 hasta ≈ 40 cm. Fungsi konversi: f(h) = 40h</p>
            <div class="overflow-x-auto">
              <table class="text-sm w-full border-collapse">
                <thead><tr class="bg-primary text-on-primary"><th class="px-3 py-2 text-left rounded-tl-lg">Hasta (h)</th><th class="px-3 py-2 text-left rounded-tr-lg">Sentimeter = f(h) = 40h</th></tr></thead>
                <tbody class="divide-y divide-outline-variant">
                  <tr class="bg-surface-container-low"><td class="px-3 py-2">3</td><td class="px-3 py-2 font-bold text-primary">120 cm</td></tr>
                  <tr><td class="px-3 py-2">6</td><td class="px-3 py-2 font-bold text-primary">240 cm</td></tr>
                  <tr class="bg-surface-container-low"><td class="px-3 py-2">7</td><td class="px-3 py-2 font-bold text-primary">280 cm</td></tr>
                </tbody>
              </table>
            </div>
            <p class="text-xs text-on-surface-variant mt-2">Kain Tope Le'leng sebelum dijahit: 7 hasta = 280 cm. Setelah dijahit: 6 hasta panjang × 3 hasta lebar = 240 cm × 120 cm.</p>
          </div>
        </div>`
          },
          {
            id: 'latihan', icon: 'fitness_center', title: 'Latihan', content: `
        <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-4">
          <div class="flex items-center gap-2 mb-4"><span class="material-symbols-outlined text-primary">fitness_center</span><h4 class="font-bold text-primary">Soal Latihan Relasi & Fungsi</h4></div>
          <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 border border-outline-variant">
              <p class="text-xs font-bold text-secondary uppercase mb-2">Soal 1</p>
              <p class="text-sm text-on-surface-variant">Diketahui A = {Ammatoa, Galla Puto, Galla Lombo} dan B = {Pemimpin adat, Urusan dalam, Urusan luar}. Relasi "memiliki tugas" menghubungkan A ke B. Nyatakan relasi ini dalam:</p>
              <ul class="text-sm list-alpha list-inside mt-2 space-y-0.5">
                <li>a. Diagram panah</li>
                <li>b. Himpunan pasangan berurutan</li>
                <li>c. Apakah relasi ini merupakan fungsi? Jelaskan!</li>
              </ul>
            </div>
            <div class="bg-white rounded-xl p-4 border border-outline-variant">
              <p class="text-xs font-bold text-secondary uppercase mb-2">Soal 2</p>
              <p class="text-sm text-on-surface-variant">Fungsi f(h) = 40h menyatakan konversi hasta ke sentimeter. Jika diketahui domain = {1, 2, 3, 6, 7}, tentukan:</p>
              <ul class="text-sm list-alpha list-inside mt-2 space-y-0.5">
                <li>a. Range fungsi tersebut</li>
                <li>b. Nilai f(6) dan interpretasinya dalam konteks kain Tope Le'leng</li>
              </ul>
            </div>
            <div class="bg-white rounded-xl p-4 border border-outline-variant">
              <p class="text-xs font-bold text-secondary uppercase mb-2">Soal 3</p>
              <p class="text-sm text-on-surface-variant">Dari diagram panah berikut, tentukan mana yang merupakan fungsi dan mana yang bukan. Berikan alasanmu!</p>
              <ul class="text-sm list-alpha list-inside mt-2 space-y-1">
                <li>a. Setiap kampung adat → tepat satu wilayah</li>
                <li>b. Satu motif kain → dua atau lebih makna berbeda</li>
                <li>c. Setiap alat tenun → tepat satu fungsinya</li>
              </ul>
            </div>
          </div>
        </div>
        <p class="text-xs text-on-surface-variant text-center">Kerjakan latihan di buku tulis, lalu cek jawabanmu di halaman Latihan.</p>`
          },
          {
            id: 'ringkasan', icon: 'summarize', title: 'Ringkasan', content: `
        <img src="../Asset/Images/pasang_ri_kajang.png" alt="Pasang ri Kajang" class="w-full rounded-xl object-cover opacity-80 mb-4" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <p class="text-xs text-on-surface-variant text-center mb-4">Seperti Pasang ri Kajang yang memiliki aturan pasti, fungsi matematika memiliki aturan yang tegas.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${[
                ['Relasi', 'Hubungan antara anggota himpunan A dengan anggota himpunan B'],
                ['Cara menyatakan', 'Diagram panah, Diagram Cartesius, Himpunan pasangan berurutan'],
                ['Fungsi', 'Relasi khusus: setiap anggota domain tepat satu anggota kodomain'],
                ['Domain', 'Himpunan nilai masukan / himpunan asal'],
                ['Kodomain', 'Himpunan nilai yang mungkin menjadi keluaran'],
                ['Range', 'Himpunan nilai yang benar-benar dipasangkan'],
              ].map(([k, v]) => `<div class="bg-surface-container-low border border-outline-variant rounded-xl p-3"><p class="font-bold text-primary text-sm">${k}</p><p class="text-xs text-on-surface-variant mt-1">${v}</p></div>`).join('')}
        </div>`
          }
        ]
      },

      5: {
        label: 'Bab 5', title: 'Bangun Datar', time: '22 menit', level: 'Menengah',
        intro: 'Menentukan luas dan menyelesaikan masalah terkait berbagai bangun datar.',
        hero: '../Asset/Images/rumah_adat_kajangbangundatar.png',
        tujuan: [
          'Menentukan luas berbagai bangun datar',
          'Menyelesaikan masalah terkait bangun datar',
          'Mengaitkan konsep bangun datar dengan kehidupan sehari-hari'
        ],
        prev: 4, next: 6,
        sections: [
          {
            id: 'pengantar-bd', icon: 'shape_line', title: 'Pengertian Bangun Datar', content: `
        <p class="text-sm text-on-surface-variant mb-4">Bangun datar adalah bangun dua dimensi yang memiliki panjang dan lebar, tetapi tidak memiliki tinggi atau ketebalan. Setiap bangun datar memiliki bentuk, sifat, keliling, dan luas yang berbeda-beda.</p>
        <img src="../Asset/Images/bangun-datar-rumah.png" alt="Rumah Adat Kajang" class="w-full rounded-xl object-cover opacity-80 mb-2" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <p class="text-xs text-on-surface-variant text-center">Atap dan dinding rumah adat Kajang mengandung berbagai bentuk bangun datar.</p>`
          },
          {
            id: 'rumus-bd', icon: 'straighten', title: 'Rumus Luas Bangun Datar', content: `
        <div class="overflow-x-auto">
          <table class="text-sm w-full border-collapse">
            <thead><tr class="bg-primary text-on-primary"><th class="px-4 py-2 text-left rounded-tl-lg">Bangun Datar</th><th class="px-4 py-2 text-left rounded-tr-lg">Rumus Luas</th></tr></thead>
            <tbody class="divide-y divide-outline-variant">
              <tr class="bg-surface-container-low"><td class="px-4 py-2 font-semibold">Persegi</td><td class="px-4 py-2 font-mono text-primary">s × s = s²</td></tr>
              <tr><td class="px-4 py-2 font-semibold">Persegi Panjang</td><td class="px-4 py-2 font-mono text-primary">p × l</td></tr>
              <tr class="bg-surface-container-low"><td class="px-4 py-2 font-semibold">Segitiga</td><td class="px-4 py-2 font-mono text-primary">½ × a × t</td></tr>
              <tr><td class="px-4 py-2 font-semibold">Lingkaran</td><td class="px-4 py-2 font-mono text-primary">π × r²</td></tr>
              <tr class="bg-surface-container-low"><td class="px-4 py-2 font-semibold">Jajargenjang</td><td class="px-4 py-2 font-mono text-primary">a × t</td></tr>
              <tr><td class="px-4 py-2 font-semibold">Trapesium</td><td class="px-4 py-2 font-mono text-primary">½ × (a + b) × t</td></tr>
            </tbody>
          </table>
        </div>`
          },
          {
            id: 'contoh-bd', icon: 'quiz', title: 'Contoh Perhitungan', content: `
        <div class="space-y-3">
          ${[
                ['Persegi', 'Sisi = 8 cm', 'Luas = 8 × 8 = <strong class="text-primary">64 cm²</strong>'],
                ['Persegi Panjang', 'Panjang = 12 cm, Lebar = 5 cm', 'Luas = 12 × 5 = <strong class="text-primary">60 cm²</strong>'],
                ['Segitiga', 'Alas = 10 cm, Tinggi = 8 cm', 'Luas = ½ × 10 × 8 = <strong class="text-primary">40 cm²</strong>'],
                ['Lingkaran', 'Jari-jari = 7 cm', 'Luas = 22/7 × 7 × 7 = <strong class="text-primary">154 cm²</strong>'],
              ].map(([b, d, j]) => `
          <div class="example-card bg-surface-container-low rounded-xl p-4">
            <p class="text-xs font-bold text-secondary uppercase mb-1">${b}</p>
            <p class="text-sm text-on-surface-variant">${d}</p>
            <p class="text-sm mt-1">${j}</p>
          </div>`).join('')}
        </div>`
          }
        ]
      },

      6: {
        label: 'Bab 6', title: 'Bangun Ruang', time: '26 menit', level: 'Lanjut',
        intro: 'Menentukan luas permukaan dan volume bangun ruang: prisma, tabung, bola, limas, dan kerucut.',
        hero: '../Asset/Images/rumah-adat-3D.png',
        tujuan: [
          'Menentukan luas permukaan bangun ruang',
          'Menentukan volume prisma, tabung, bola, limas, dan kerucut',
          'Menyelesaikan masalah terkait bangun ruang dalam kehidupan sehari-hari'
        ],
        prev: 5, next: 7,
        sections: [
          {
            id: 'pengantar-br', icon: 'view_in_ar', title: 'Pengertian Bangun Ruang', content: `
        <p class="text-sm text-on-surface-variant mb-4">Bangun ruang adalah bangun tiga dimensi yang memiliki panjang, lebar, dan tinggi sehingga memiliki <strong>luas permukaan</strong> dan <strong>volume</strong>. Bangun ruang banyak dijumpai dalam kehidupan sehari-hari, seperti kotak, kaleng, bola, dan tenda.</p>
        <img src="../Asset/Images/rumah-adat3D-detail.png" alt="Hutan Adat Kajang" class="w-full rounded-xl object-cover opacity-80" style="aspect-ratio: 16 / 5; object-fit: cover;"/>`
          },
          {
            id: 'rumus-br', icon: 'straighten', title: 'Rumus Luas Permukaan & Volume', content: `
        <div class="overflow-x-auto">
          <table class="text-sm w-full border-collapse">
            <thead><tr class="bg-primary text-on-primary"><th class="px-3 py-2 rounded-tl-lg">Bangun</th><th class="px-3 py-2">Luas Permukaan</th><th class="px-3 py-2 rounded-tr-lg">Volume</th></tr></thead>
            <tbody class="divide-y divide-outline-variant">
              <tr class="bg-surface-container-low"><td class="px-3 py-2 font-semibold">Prisma</td><td class="px-3 py-2 font-mono text-primary">2×La + K×t</td><td class="px-3 py-2 font-mono text-primary">La × t</td></tr>
              <tr><td class="px-3 py-2 font-semibold">Tabung</td><td class="px-3 py-2 font-mono text-primary">2πr(r+t)</td><td class="px-3 py-2 font-mono text-primary">πr²t</td></tr>
              <tr class="bg-surface-container-low"><td class="px-3 py-2 font-semibold">Bola</td><td class="px-3 py-2 font-mono text-primary">4πr²</td><td class="px-3 py-2 font-mono text-primary">⁴⁄₃πr³</td></tr>
              <tr><td class="px-3 py-2 font-semibold">Limas</td><td class="px-3 py-2 font-mono text-primary">La + ½×K×ts</td><td class="px-3 py-2 font-mono text-primary">⅓×La×t</td></tr>
              <tr class="bg-surface-container-low"><td class="px-3 py-2 font-semibold">Kerucut</td><td class="px-3 py-2 font-mono text-primary">πr(r+s)</td><td class="px-3 py-2 font-mono text-primary">⅓πr²t</td></tr>
            </tbody>
          </table>
        </div>`
          },
          {
            id: 'contoh-br', icon: 'quiz', title: 'Contoh Perhitungan', content: `
        <div class="space-y-3">
          ${[
                ['Prisma', 'La = 24 cm², t = 10 cm', 'Volume = 24 × 10 = <strong class="text-primary">240 cm³</strong>'],
                ['Tabung', 'r = 7 cm, t = 10 cm', 'Volume = 22/7 × 7² × 10 = <strong class="text-primary">1.540 cm³</strong>'],
                ['Bola', 'r = 7 cm', 'Luas Permukaan = 4 × 22/7 × 7² = <strong class="text-primary">616 cm²</strong>'],
                ['Limas', 'La = 36 cm², t = 12 cm', 'Volume = ⅓ × 36 × 12 = <strong class="text-primary">144 cm³</strong>'],
                ['Kerucut', 'r = 7 cm, t = 12 cm', 'Volume = ⅓ × 22/7 × 7² × 12 = <strong class="text-primary">616 cm³</strong>'],
              ].map(([b, d, j]) => `
          <div class="example-card bg-surface-container-low rounded-xl p-4">
            <p class="text-xs font-bold text-secondary uppercase mb-1">${b}</p>
            <p class="text-sm text-on-surface-variant">${d}</p>
            <p class="text-sm mt-1">${j}</p>
          </div>`).join('')}
        </div>`
          }
        ]
      },

      7: {
        label: 'Bab 7', title: 'Geometri', time: '35 menit', level: 'Menengah',
        intro: 'Hubungan antar sudut, kekongruenan, kesebangunan, Teorema Pythagoras, dan transformasi geometri.',
        hero: '../Asset/Images/kain-koordinat.png',
        tujuan: [
          'Menggunakan hubungan antar sudut pada garis sejajar dan segitiga',
          'Memahami dan menerapkan sifat kekongruenan dan kesebangunan',
          'Membuktikan dan menggunakan Teorema Pythagoras',
          'Melakukan transformasi tunggal pada bidang koordinat Kartesius'
        ],
        prev: 6, next: 8,
        sections: [
          {
            id: 'sudut', icon: 'architecture', title: 'Hubungan Antar Sudut', content: `
        <img src="../Asset/Images/koordinat-kain.png" alt="Peta Desa Adat" class="w-full rounded-xl object-cover opacity-80 mb-4" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <div class="space-y-3 text-sm text-on-surface-variant">
          <div class="bg-surface-container rounded-xl p-3"><strong class="text-primary">Sudut berpelurus:</strong> dua sudut yang jumlahnya 180°</div>
          <div class="bg-surface-container rounded-xl p-3"><strong class="text-primary">Sudut bertolak belakang:</strong> dua sudut yang saling berhadapan dan besarnya sama</div>
          <div class="bg-surface-container rounded-xl p-3"><strong class="text-primary">Sudut sehadap, dalam berseberangan, luar berseberangan</strong> pada dua garis sejajar yang dipotong transversal</div>
          <div class="formula-box rounded-xl p-3"><strong class="text-primary">Jumlah sudut segitiga = 180°</strong></div>
        </div>`
          },
          {
            id: 'kongruen-sebangun', icon: 'compare', title: 'Kekongruenan & Kesebangunan', content: `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="border-2 border-primary rounded-xl p-4">
            <p class="font-bold text-primary text-sm mb-2">Kekongruenan ≅</p>
            <p class="text-xs text-on-surface-variant">Dua bangun kongruen jika memiliki <strong>bentuk dan ukuran yang sama</strong>. Sisi dan sudut yang bersesuaian sama besar.</p>
            <div class="example-card bg-surface-container-low rounded-xl p-2 mt-2 text-xs">Dua persegi dengan sisi 5 cm masing-masing → kongruen</div>
          </div>
          <div class="border-2 border-secondary rounded-xl p-4">
            <p class="font-bold text-secondary text-sm mb-2">Kesebangunan ~</p>
            <p class="text-xs text-on-surface-variant">Dua bangun sebangun jika memiliki <strong>bentuk yang sama</strong>, ukuran boleh berbeda. Sisi bersesuaian berbanding sama, sudut bersesuaian sama.</p>
            <div class="bg-surface-container-low rounded-xl p-2 mt-2 text-xs">Persegi sisi 4 cm dan 8 cm → sebangun (rasio 1:2)</div>
          </div>
        </div>
        <div class="formula-box rounded-xl p-4">
          <p class="text-xs font-bold text-primary uppercase mb-1">Teorema Pythagoras</p>
          <p class="font-mono text-primary font-bold">c² = a² + b²</p>
          <p class="text-xs text-on-surface-variant mt-1">Contoh: a = 6 cm, b = 8 cm → c = √(36+64) = √100 = <strong>10 cm</strong></p>
        </div>`
          },
          {
            id: 'transformasi', icon: 'transform', title: 'Transformasi Geometri', content: `
        <div class="grid grid-cols-2 gap-3">
          ${[
                ['Translasi', 'Pergeseran', 'Memindahkan bangun sejauh jarak tertentu tanpa mengubah bentuk'],
                ['Refleksi', 'Pencerminan', 'Mencerminkan bangun terhadap suatu garis'],
                ['Rotasi', 'Perputaran', 'Memutar bangun terhadap titik pusat dengan sudut tertentu'],
                ['Dilatasi', 'Perbesaran/Pengecilan', 'Memperbesar atau memperkecil bangun dengan faktor skala k'],
              ].map(([n, s, d]) => `
          <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3">
            <p class="font-bold text-primary text-sm">${n}</p>
            <p class="text-xs text-secondary font-semibold">(${s})</p>
            <p class="text-xs text-on-surface-variant mt-1">${d}</p>
          </div>`).join('')}
        </div>`
          }
        ]
      },

      8: {
        label: 'Bab 8', title: 'Analisis Data & Peluang', time: '30 menit', level: 'Lanjut',
        intro: 'Mengumpulkan, menyajikan, menganalisis data, serta menghitung peluang, frekuensi relatif, dan frekuensi harapan.',
        hero: '../Asset/Images/ritual_adat_kajang.png',
        tujuan: [
          'Merumuskan pertanyaan, mengumpulkan, menyajikan, dan menganalisis data',
          'Menggunakan diagram batang dan lingkaran',
          'Menentukan dan menafsirkan mean, median, modus, dan range',
          'Menjelaskan dan menggunakan konsep peluang, frekuensi relatif, dan frekuensi harapan'
        ],
        prev: 7, next: 1,
        sections: [
          {
            id: 'data', icon: 'bar_chart', title: 'Data & Penyajian Data', content: `
        <p class="text-sm text-on-surface-variant mb-3">Data adalah kumpulan fakta, angka, atau informasi yang diperoleh melalui pengamatan, pengukuran, atau survei.</p>
        <img src="../Asset/Images/gambarmateri.png" alt="Ritual Adat Kajang" class="w-full rounded-xl object-cover opacity-80 mb-4" style="aspect-ratio: 16 / 5; object-fit: cover;"/>
        <div class="grid grid-cols-2 gap-3 mb-4">
          ${['Observasi (pengamatan)', 'Wawancara', 'Angket / kuesioner', 'Dokumentasi'].map(c => `<div class="bg-surface-container rounded-xl p-2 text-xs text-center font-medium text-primary border border-outline-variant">${c}</div>`).join('')}
        </div>
        <div class="note-box rounded-xl p-4 text-sm">
          <p class="font-bold text-on-surface mb-1">Diagram Batang</p>
          <p class="text-on-surface-variant text-xs">Digunakan untuk membandingkan banyaknya data pada setiap kategori.</p>
          <p class="font-bold text-on-surface mt-2 mb-1">Diagram Lingkaran</p>
          <p class="text-on-surface-variant text-xs">Menunjukkan perbandingan atau persentase setiap kategori terhadap keseluruhan data.</p>
          <p class="text-xs mt-1">Persentase = (frekuensi ÷ total data) × 100%</p>
        </div>`
          },
          {
            id: 'statistika', icon: 'analytics', title: 'Ukuran Statistika', content: `
        <div class="space-y-4">
          <div class="formula-box rounded-xl p-4">
            <p class="font-bold text-primary text-sm mb-1">Mean (Rata-rata)</p>
            <p class="font-mono text-primary">Mean = Jumlah data ÷ Banyak data</p>
            <div class="example-card bg-white/60 rounded-lg p-3 mt-2 text-xs">
              Data: 6, 8, 7, 9, 10<br/>Mean = (6+8+7+9+10) ÷ 5 = 40 ÷ 5 = <strong>8</strong>
            </div>
          </div>
          <div class="formula-box rounded-xl p-4">
            <p class="font-bold text-primary text-sm mb-1">Median (Nilai Tengah)</p>
            <p class="text-xs text-on-surface-variant mb-2">Urutkan data, lalu ambil nilai tengah. Jika genap, rata-rata dua nilai tengah.</p>
            <div class="example-card bg-white/60 rounded-lg p-3 text-xs">
              Data ganjil: 5, 7, <strong>8</strong>, 9, 11 → Median = <strong>8</strong><br/>
              Data genap: 4, 6, 8, 10 → Median = (6+8) ÷ 2 = <strong>7</strong>
            </div>
          </div>
          <div class="formula-box rounded-xl p-4">
            <p class="font-bold text-primary text-sm mb-1">Modus (Nilai Terbanyak)</p>
            <div class="example-card bg-white/60 rounded-lg p-3 mt-2 text-xs">
              Data: 2, 3, 3, 4, 5, 5, 5, 6 → Modus = <strong>5</strong> (muncul 3 kali)
            </div>
          </div>
          <div class="formula-box rounded-xl p-4">
            <p class="font-bold text-primary text-sm mb-1">Range (Jangkauan)</p>
            <p class="font-mono text-primary text-sm">Range = Nilai terbesar − Nilai terkecil</p>
            <div class="example-card bg-white/60 rounded-lg p-3 mt-2 text-xs">
              Data: 5, 7, 9, 10, 12 → Range = 12 − 5 = <strong>7</strong>
            </div>
          </div>
        </div>`
          },
          {
            id: 'peluang', icon: 'casino', title: 'Peluang', content: `
        <div class="formula-box rounded-xl p-4 mb-4">
          <p class="font-bold text-primary text-sm mb-1">Rumus Peluang</p>
          <p class="font-mono text-primary">P(A) = n(A) ÷ n(S)</p>
          <p class="text-xs text-on-surface-variant mt-1">n(A) = banyak kejadian yang diinginkan, n(S) = banyak seluruh kemungkinan</p>
          <p class="text-xs text-on-surface-variant">Nilai peluang: 0 ≤ P(A) ≤ 1</p>
        </div>
        <div class="example-card bg-surface-container-low rounded-xl p-4 mb-4">
          <p class="text-xs font-bold text-secondary uppercase mb-1">Contoh</p>
          <p class="text-sm">Sebuah dadu dilempar sekali. Peluang muncul angka 4:</p>
          <p class="text-sm font-bold text-primary">P = 1/6</p>
        </div>
        <div class="formula-box rounded-xl p-4 mb-4">
          <p class="font-bold text-primary text-sm mb-1">Frekuensi Relatif</p>
          <p class="font-mono text-primary text-sm">FR = Frekuensi kejadian ÷ Jumlah percobaan</p>
          <div class="text-xs text-on-surface-variant mt-1">Koin dilempar 20 kali, muncul gambar 12 kali. FR = 12/20 = <strong>0,6</strong></div>
        </div>
        <div class="formula-box rounded-xl p-4">
          <p class="font-bold text-primary text-sm mb-1">Frekuensi Harapan</p>
          <p class="font-mono text-primary text-sm">FH = P(A) × Jumlah percobaan</p>
          <div class="text-xs text-on-surface-variant mt-1">Dadu dilempar 60 kali. P(5) = 1/6. FH = 1/6 × 60 = <strong>10 kali</strong></div>
        </div>`
          }
        ]
      }
    };

    // ===================== RENDER =====================
    const params = new URLSearchParams(window.location.search);
    const babId = parseInt(params.get('bab'), 10) || 1;
    const ch = chapters[babId] || chapters[1];

    document.title = ch.title + ' | KANUM';
    document.getElementById('crumb').textContent = ch.label + ' — ' + ch.title;
    document.getElementById('bab-label').textContent = ch.label;
    document.getElementById('bab-title').textContent = ch.title;
    document.getElementById('bab-intro').textContent = ch.intro;
    document.getElementById('bab-time').textContent = ch.time;
    document.getElementById('bab-level').textContent = ch.level;
    document.getElementById('hero-img').src = ch.hero;
    document.getElementById('hero-img').alt = ch.title;
    document.getElementById('prev-link').href = 'materi-detail?bab=' + ch.prev;
    document.getElementById('next-link').href = 'materi-detail?bab=' + ch.next;
    document.getElementById('latihan-link').href = 'latihan-detail.html?chapter=' + babId;

    // Tujuan
    const tujuanList = document.getElementById('tujuan-list');
    tujuanList.innerHTML = ch.tujuan.map(t =>
      `<li class="flex items-start gap-2 text-sm text-on-surface-variant">
    <span class="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
    <span>${t}</span>
  </li>`
    ).join('');

    // TOC
    const tocNav = document.getElementById('toc-nav');
    tocNav.innerHTML = ch.sections.map(s =>
      `<a href="#${s.id}" class="toc-item flex items-center gap-2 px-2 py-1.5 text-xs text-on-surface-variant hover:text-primary">
    <span class="material-symbols-outlined text-sm">${s.icon}</span>${s.title}
  </a>`
    ).join('');

    // Sections
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ch.sections.map(s => `
  <article id="${s.id}" class="section-reveal bg-white border border-outline-variant rounded-2xl p-5 shadow-sm">
    <div class="flex items-center gap-2 mb-4">
      <div class="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-base">${s.icon}</span>
      </div>
      <h2 class="font-display font-bold text-primary text-lg">${s.title}</h2>
    </div>
    <div>${s.content}</div>
  </article>
`).join('');

    // Intersection observer for reveal
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.section-reveal').forEach(el => observer.observe(el));

    // TOC active
    const tocLinks = document.querySelectorAll('#toc-nav a');
    const sections = document.querySelectorAll('#main-content article');
    const tocObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          tocLinks.forEach(l => l.classList.remove('active'));
          const active = document.querySelector(`#toc-nav a[href="#${e.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    }, { threshold: 0.5 });
    sections.forEach(s => tocObserver.observe(s));

})();

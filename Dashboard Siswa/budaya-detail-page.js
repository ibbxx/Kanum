/**
 * KANUM – Budaya Detail Page Logic
 */
(function () {
  'use strict';

    /* =================================================================
       DATA — topik etnomatematika Ammatoa Kajang (berdasarkan PDF)
    ================================================================= */
    const topics = {
      history: {
        badge: 'Sejarah',
        title: 'Sejarah Masyarakat Adat Ammatoa Kajang',
        description: `Masyarakat adat Kajang, khususnya komunitas adat Ammatoa di Bulukumba, Sulawesi Selatan, adalah kelompok masyarakat yang hingga kini masih memelihara warisan budaya leluhur secara sangat kuat. Mereka tinggal di kawasan adat (Tana Toa, Tanah Toa, dan beberapa kampung adat dalam wilayah Kajang) yang relatif terisolasi secara geografis. Walaupun belum banyak catatan tertulis sejak masa pra-kolonial, penelitian etnografi dan sosiologis menggambarkan bahwa masyarakat Kajang sudah memilih pola hidup sederhana jauh sebelum era modern.

Asal-usul masyarakat suku Kajang diyakini melalui beberapa versi mitologis. Versi pertama: Kisah To Manurung — masyarakat Kajang meyakini bahwa manusia pertama di Kajang adalah To Manurung (manusia yang turun dari langit) atas kehendak Turi'e A'ra'na (Tuhan Yang Maha Esa). Kehadiran To Manurung ini diperkirakan terjadi sekitar tahun 1300 M.

Orang Kajang diyakini berasal dari To Manurung yang bernama Batara Daeng Rilangi (Gadis cantik dari langit) yang dinikahi oleh Tamparang Daeng Malowang. Pernikahan keduanya melahirkan tiga orang anak yang kelak menjadi penguasa di tiga daerah terpisah: Tau Tentaya Matanna (Raja Laikang), Tau Kale Bojo'a (Raja Lembang), dan Tau Sapaya Lilana (Raja Kajang).

Versi kedua: Burung Koajang — versi lain menyebutkan bahwa nama Kajang berasal dari burung yang digunakan To Manurung turun ke bumi, yaitu burung Koajang. Istilah "Kajang" memiliki setidaknya tiga versi makna: (1) Koajang — nama burung yang digunakan To Manurung turun ke bumi; (2) Sikajarian/Akkajarian — berarti "segala sesuatu tercipta mula-mula dari daerah Tanatowa" (sekarang Desa Tanah Towa); (3) Kajang (Bahasa Melayu) — berarti "tempat bernaung".`,
        heroImage: '../Asset/Images/sejarah_masyarakat_adat_kajang.png',
        gallery: [
          {
            src: '../Asset/Images/sejarah_masyarakat_adat_kajang.png',
            title: 'Masyarakat Adat Ammatoa Kajang',
            caption: 'Komunitas Adat',
            desc: 'Masyarakat adat Kajang di Bulukumba, Sulawesi Selatan, memelihara warisan budaya leluhur secara sangat kuat. Mereka tinggal di kawasan adat yang relatif terisolasi secara geografis.',
            math: ''
          },
          {
            isMap: true,
            title: 'Lokasi Desa Adat Ammatoa Kajang',
            mapUrl: 'https://maps.google.com/maps?q=Desa+Adat+Ammatoa+Kajang&t=&z=15&ie=UTF8&iwloc=&output=embed'
          },
          {
            src: '../Asset/Images/to_manurung_mitologi.png',
            title: 'To Manurung — Mitologi Asal-usul',
            caption: 'Mitologi Suku Kajang',
            desc: 'Masyarakat Kajang meyakini bahwa manusia pertama di Kajang adalah To Manurung atas kehendak Turi\'e A\'ra\'na (Tuhan Yang Maha Esa). Kehadiran To Manurung diperkirakan terjadi sekitar tahun 1300 M.',
            math: ''
          },
          {
            src: '../Asset/Images/pasang_ri_kajang.png',
            title: 'Pasang Ri Kajang',
            caption: 'Sejarah & Ketahanan',
            desc: 'Masyarakat Kajang bertahan terhadap pengaruh luar termasuk kolonialisme, kenegaraan modern, dan teknologi dengan tetap mempertahankan aturan adat (Pasang ri Kajang), pakaian hitam sebagai simbol identitas budaya, dan praktik kehidupan yang selaras dengan alam.',
            math: ''
          }
        ],
        mathConnection: `Sistem pengukuran hasta yang digunakan masyarakat Kajang dalam proses menenun Kain Tope Le'leng merupakan contoh nyata penerapan matematika dalam budaya. 1 hasta ≈ 40 cm. Sebelum dijahit, kain berukuran 7 hasta panjang. Setelah dijahit, kain berukuran 6 hasta panjang dan 3 hasta lebar, sehingga ukuran akhir kain adalah 240 cm × 120 cm.

Pengulangan motif pada kain Tope Le'leng yang teratur merupakan bentuk nyata dari konsep pola bilangan. Jumlah benang yang digunakan sebagai dasar pola selalu ganjil, karena dianggap membawa keseimbangan dan keberuntungan — sebuah pemahaman matematika tentang bilangan ganjil yang diterapkan secara kultural.`,
        relatedMaterial: [
          {
            icon: 'calculate',
            name: 'Sistem Pengukuran',
            relation: 'Masyarakat Kajang menggunakan sistem pengukuran tradisional hasta (1 hasta ≈ 40 cm) dalam pembuatan Kain Tope Le\'leng.',
            concepts: ['Konversi satuan', 'Pengukuran panjang', 'Perkalian'],
            benefit: 'Siswa mampu memahami sistem pengukuran non-standar dan konversinya ke satuan baku.'
          },
          {
            icon: 'calculate',
            name: 'Pola Bilangan Ganjil',
            relation: 'Jumlah benang dasar dalam tenun Kajang selalu ganjil, mencerminkan konsep bilangan ganjil dalam matematika.',
            concepts: ['Bilangan ganjil', 'Pola bilangan', 'Barisan'],
            benefit: 'Siswa memahami sifat bilangan ganjil melalui konteks budaya yang autentik.'
          },
          {
            icon: 'straighten',
            name: 'Perbandingan Ukuran',
            relation: 'Ukuran kain Tope Le\'leng (240 cm × 120 cm) memperlihatkan perbandingan panjang dan lebar yang dapat dihitung.',
            concepts: ['Rasio', 'Proporsi', 'Perbandingan'],
            benefit: 'Siswa memahami perbandingan ukuran dari konteks produk budaya nyata.'
          }
        ],
        funFacts: [
          {
            icon: 'history_edu',
            title: 'To Manurung Sekitar Tahun 1300 M',
            body: 'Kehadiran To Manurung — manusia pertama yang dipercaya turun dari langit — di Kajang diperkirakan terjadi sekitar tahun 1300 M. Ini menjadikan komunitas Ammatoa Kajang salah satu komunitas adat tertua yang masih mempertahankan tradisi leluhurnya hingga hari ini.'
          },
          {
            icon: 'auto_awesome',
            title: 'Tiga Makna Nama "Kajang"',
            body: 'Nama "Kajang" memiliki setidaknya tiga versi makna: nama burung Koajang yang digunakan To Manurung turun ke bumi, kata Sikajarian/Akkajarian yang berarti "segala sesuatu tercipta mula-mula dari Tanatowa", dan kata Kajang dalam Bahasa Melayu yang berarti "tempat bernaung".'
          },
          {
            icon: 'eco',
            title: 'Kawasan Adat yang Terisolasi',
            body: 'Masyarakat Kajang tinggal di kawasan adat (Tana Toa, Tanah Toa, dan beberapa kampung adat dalam wilayah Kajang) yang relatif terisolasi secara geografis. Isolasi ini justru menjadi kekuatan dalam mempertahankan tradisi leluhur dari pengaruh modernisasi.'
          }
        ]
      },
      philosophy: {
        badge: 'Filosofi',
        title: 'Filosofi Hidup & Kepercayaan',
        description: `Salah satu filosofi utama masyarakat Kajang adalah kamase-masea, yang bermakna hidup sederhana dan rendah hati. Nilai ini tercermin dalam: pakaian serba hitam tanpa motif, pola konsumsi yang sederhana, interaksi sosial yang harmonis, dan penghormatan terhadap alam dan leluhur.

Selain kesederhanaan, masyarakat Kajang juga menjunjung tinggi nilai kejujuran (kalambusang). Nilai ini tercermin dalam motif lurus pada kain Tope Le'leng yang melambangkan "kelurusan" dalam moral dan tindakan.

Agama orang Kajang secara administratif adalah Islam. Meskipun demikian, terdapat perbedaan pengamalan antara orang Kajang Dalam dan Kajang Luar. Kajang Dalam masih memegang teguh ajaran leluhur dari Pasang ri Kajang; mengamalkan Islam kebatinan (tarekat) dengan konsep "sembayang tatappu je'ne talluka" (sholat yang tak putus-putus dan wudhu yang tak pernah batal). Kajang Luar menjalankan syariat Islam seperti sholat, puasa, zakat, dan haji. Masyarakat Kajang juga menganut sistem kepercayaan lokal Patuntung, yang mengatur hubungan manusia dengan Tuhan, alam, masyarakat, dan leluhur.`,
        heroImage: '../Asset/Images/filosofi_kamase_masea.png',
        gallery: [
          {
            src: '../Asset/Images/filosofi_kamase_masea.png',
            title: 'Filosofi Kamase-masea',
            caption: 'Hidup Sederhana',
            desc: 'Kamase-masea bermakna hidup sederhana dan rendah hati. Nilai ini tercermin dalam pakaian serba hitam tanpa motif, pola konsumsi yang sederhana, interaksi sosial yang harmonis, dan penghormatan terhadap alam dan leluhur.',
            math: ''
          },
          {
            src: '../Asset/Images/arsitektur_rumah_barat.png',
            title: 'Rumah Menghadap ke Barat (Gunung Bawakaraeng)',
            caption: 'Filosofi Arsitektur',
            desc: 'Rumah menghadap ke barat (Gunung Bawakaraeng) melambangkan kesadaran bahwa kehidupan di dunia ini sementara; rumah membelakangi Borong Karama\' (hutan keramat).',
            math: ''
          },
          {
            src: '../Asset/Images/dapur_depan_rumah.png',
            title: 'Dapur di Depan Rumah',
            caption: 'Filosofi Keterbukaan',
            desc: 'Dapur di depan rumah melambangkan keterbukaan dan kejujuran; tamu dapat melihat makanan yang akan disajikan.',
            math: 'Nilai kalambusang (kejujuran) tercermin dalam motif lurus kain Tope Le\'leng yang melambangkan kelurusan dalam moral dan tindakan.'
          },
          {
            src: '../Asset/Images/tidak_memakai_alas_kaki.png',
            title: 'Tidak Memakai Alas Kaki',
            caption: 'Filosofi Spiritual',
            desc: 'Tidak memakai alas kaki melambangkan hubungan spiritual antara manusia dan bumi (ibu).',
            math: ''
          },
          {
            src: '../Asset/Images/semua_rumah_serupa.png',
            title: 'Semua Rumah Serupa',
            caption: 'Filosofi Kesetaraan',
            desc: 'Semua rumah serupa merupakan penegasan ajaran Pasang ri Kajang untuk hidup sederhana.',
            math: ''
          }
        ],
        mathConnection: `Filosofi kalambusang (kejujuran) pada masyarakat Kajang tercermin dalam motif lurus pada kain Tope Le'leng. Garis lurus dalam matematika adalah konsep geometri dasar yang merepresentasikan jarak terpendek antara dua titik — sebuah simbol kelurusan yang relevan dengan nilai moral masyarakat Kajang.

Filosofi kesetaraan (semua rumah serupa, semua pakaian hitam tanpa motif) mencerminkan konsep keseragaman dan kekongruenan dalam matematika — di mana bentuk-bentuk yang identik memiliki nilai yang sama tanpa hierarki.`,
        relatedMaterial: [
          {
            icon: 'shape_line',
            name: 'Geometri Garis',
            relation: 'Motif lurus pada kain Tope Le\'leng yang melambangkan kalambusang berkaitan dengan konsep garis lurus dalam geometri.',
            concepts: ['Garis lurus', 'Sudut', 'Kesejajaran'],
            benefit: 'Siswa memahami konsep garis dan sifat-sifatnya dari konteks motif budaya.'
          },
          {
            icon: 'flip',
            name: 'Kekongruenan',
            relation: 'Semua rumah yang serupa dalam kawasan adat Kajang merupakan contoh nyata konsep kongruensi — bentuk identik yang memiliki ukuran sama.',
            concepts: ['Kongruensi', 'Kesamaan bentuk', 'Kesebangunan'],
            benefit: 'Siswa memahami kongruensi dari konteks arsitektur budaya yang autentik.'
          }
        ],
        funFacts: [
          {
            icon: 'auto_awesome',
            title: 'Hitam yang Menyamakan Semua',
            body: 'Warna hitam pada pakaian Kajang melambangkan kesetaraan: semua warga Kajang mengenakan warna yang sama tanpa memandang status. Ini adalah bentuk keadilan sosial yang diwujudkan melalui pakaian — sebuah sistem distribusi identitas yang merata.'
          },
          {
            icon: 'balance',
            title: 'Kalambusang: Kejujuran dalam Setiap Garis',
            body: 'Nilai kejujuran (kalambusang) tercermin dalam motif lurus pada kain Tope Le\'leng. Garis lurus yang tak menyimpang melambangkan "kelurusan" dalam moral dan tindakan — sebuah nilai yang dipegang teguh oleh masyarakat Kajang.'
          },
          {
            icon: 'eco',
            title: 'Hubungan dengan Alam',
            body: 'Hubungan dengan alam menjadi sangat penting bagi masyarakat Kajang. Hutan adat dianggap bukan hanya sebagai sumber kehidupan, tetapi juga sebagai bagian spiritual dan identitas. Larangan terhadap penebangan sembarangan dan penggunaan teknologi yang dianggap merusak alam muncul dari filosofi ini.'
          }
        ]
      },
      weaving: {
        badge: 'Proses Menenun',
        title: 'Proses Pattannungan Kain Tope Le\'leng',
        description: `Proses pembuatan Kain Tope Le'leng melalui beberapa tahapan utama. Persiapan Bahan: bahan utama pembuatan Kain Tope Le'leng adalah benang katun putih yang banyak tersedia di pasaran dengan harga sekitar Rp100.000 per gulung. Pewarna alami berasal dari: Daun tarung (Indigofera tinctoria), Jeruk nipis (aporo), dan Air abu kayu fermentasi (ahu).

Proses Pewarnaan (Mappalettuk): Daun tarung direndam selama 1-2 hari dalam 10-30 liter air. Daun diperas, disaring, dan dicampur dengan air jeruk nipis serta abu kayu. Campuran ini menghasilkan cairan berwarna biru tua kehitaman. Benang direndam setiap pagi dan sore selama 14 hari hingga berubah menjadi hitam pekat. Proses pencelupan diulang beberapa kali untuk memastikan warna terserap sempurna.

Pemintalan dan Penataan Benang (Nipaturning): Benang yang telah diwarnai dikeringkan kemudian dipintal ulang. Pada tahap ini, jumlah benang yang akan digunakan sebagai dasar pola dihitung. Jumlah benang selalu ganjil, karena dianggap membawa keseimbangan dan keberuntungan.

Proses Menenun (Pattannungan): Proses menenun dilakukan sepenuhnya dengan tangan menggunakan alat-alat tradisional. Waktu yang dibutuhkan: 1-2 minggu jika dilakukan setiap hari, atau hingga 1 bulan jika dilakukan di waktu senggang.

Penyelesaian (Anggarusu'): Tahap akhir meliputi penjemuran (kain dijemur di bawah sinar matahari), pemukulan (kain dipukul dengan alat berat ±5 kg untuk meratakan serat), dan penggosokan (kain digosok dengan kerang laut/keong untuk menghasilkan kilau khas hitam mengkilap).`,
        heroImage: '../Asset/Images/proses_menenun_pattannungan.png',
        gallery: [
          {
            src: '../Asset/Images/persiapan_bahan_benang_katun.png',
            title: 'Persiapan Bahan — Benang Katun Putih',
            caption: 'Persiapan Bahan',
            desc: 'Bahan utama pembuatan Kain Tope Le\'leng adalah benang katun putih. Pewarna alami berasal dari Daun tarung (Indigofera tinctoria), Jeruk nipis (aporo), dan Air abu kayu fermentasi (ahu).',
            math: ''
          },
          {
            src: '../Asset/Images/pewarnaan_mappalettuk.png',
            title: 'Proses Pewarnaan Mappalettuk',
            caption: 'Pewarnaan (Mappalettuk)',
            desc: 'Benang direndam setiap pagi dan sore selama 14 hari hingga berubah menjadi hitam pekat. Proses pencelupan diulang beberapa kali untuk memastikan warna terserap sempurna.',
            math: 'Proses perendaman selama 14 hari (pagi dan sore = 2 kali sehari) berarti total 28 kali perendaman — sebuah perkalian sederhana dalam konteks budaya.'
          },
          {
            src: '../Asset/Images/benang_hitam_hasil_pewarnaan.png',
            title: 'Benang Hitam Hasil Pewarnaan',
            caption: 'Hasil Pewarnaan',
            desc: 'Campuran daun tarung, air jeruk nipis, dan abu kayu menghasilkan cairan berwarna biru tua kehitaman yang mewarnai benang menjadi hitam pekat.',
            math: ''
          },
          {
            src: '../Asset/Images/pemintalan_benang_nipaturning.png',
            title: 'Pemintalan dan Penataan Benang (Nipaturning)',
            caption: 'Pemintalan (Nipaturning)',
            desc: 'Jumlah benang yang akan digunakan sebagai dasar pola dihitung. Jumlah benang selalu ganjil, karena dianggap membawa keseimbangan dan keberuntungan.',
            math: 'Konsep bilangan ganjil diterapkan dalam penentuan jumlah benang dasar — pengetahuan matematika yang diwujudkan dalam tradisi budaya.'
          },
          {
            src: '../Asset/Images/proses_menenun_pattannungan.png',
            title: 'Proses Menenun (Pattannungan)',
            caption: 'Menenun (Pattannungan)',
            desc: 'Proses menenun Kain Tope Le\'leng dilakukan sepenuhnya dengan tangan menggunakan alat-alat tradisional. Waktu yang dibutuhkan: 1-2 minggu jika dilakukan setiap hari, hingga 1 bulan jika dilakukan di waktu senggang.',
            math: ''
          },
          {
            src: '../Asset/Images/penyelesaian_anggarusu.png',
            title: 'Penyelesaian — Anggarusu\'',
            caption: 'Penyelesaian (Anggarusu\')',
            desc: 'Tahap akhir meliputi penjemuran, pemukulan dengan alat berat (±5 kg) untuk meratakan serat, dan penggosokan dengan kerang laut (keong) untuk menghasilkan kilau khas hitam mengkilap.',
            math: ''
          },
          {
            src: '../Asset/Images/hasil_kain_tope_leleng.png',
            title: 'Hasil Kain Tope Le\'leng',
            caption: 'Hasil Akhir',
            desc: 'Kain Tope Le\'leng yang telah selesai dibuat memiliki kilau khas hitam mengkilap, hasil dari proses penggosokan dengan kerang laut.',
            math: ''
          }
        ],
        mathConnection: `Proses Pattannungan Kain Tope Le'leng mengandung beberapa konsep matematika yang dapat dieksplorasi.

Sistem Pengukuran Hasta: Masyarakat Kajang menggunakan sistem pengukuran tradisional yang disebut hasta, di mana 1 hasta ≈ 40 cm. Sebelum dijahit, kain berukuran 7 hasta panjang. Setelah dijahit, kain berukuran 6 hasta panjang dan 3 hasta lebar. Artinya, ukuran akhir kain: 240 cm × 120 cm. Konversi ini melibatkan operasi perkalian: 6 × 40 = 240 cm dan 3 × 40 = 120 cm.

Bilangan Ganjil dalam Jumlah Benang: Jumlah benang yang digunakan sebagai dasar pola selalu ganjil. Ini berkaitan dengan konsep bilangan ganjil dalam matematika. Siswa dapat mengeksplorasi mengapa bilangan ganjil "membawa keseimbangan" dalam konteks geometri tenun.

Waktu sebagai Pola: Proses pewarnaan berlangsung selama 14 hari dengan perendaman pagi dan sore (2 kali sehari), menghasilkan total 28 kali perendaman. Ini adalah contoh penerapan perkalian dalam konteks waktu dan proses produksi.`,
        relatedMaterial: [
          {
            icon: 'straighten',
            name: 'Sistem Pengukuran',
            relation: 'Sistem hasta (1 hasta ≈ 40 cm) dalam pembuatan Kain Tope Le\'leng berkaitan dengan konversi satuan panjang.',
            concepts: ['Konversi satuan', 'Perkalian', 'Pengukuran panjang'],
            benefit: 'Siswa mampu mengkonversi satuan pengukuran tradisional ke satuan baku SI.'
          },
          {
            icon: 'calculate',
            name: 'Bilangan Ganjil',
            relation: 'Jumlah benang dasar dalam tenun Kajang selalu ganjil — sebuah penerapan konsep bilangan ganjil dalam tradisi budaya.',
            concepts: ['Bilangan ganjil', 'Pola bilangan', 'Sifat bilangan'],
            benefit: 'Siswa memahami sifat bilangan ganjil melalui konteks budaya yang bermakna.'
          },
          {
            icon: 'timer',
            name: 'Operasi Hitung',
            relation: 'Proses pewarnaan 14 hari × 2 kali sehari = 28 kali perendaman merupakan penerapan perkalian dalam konteks nyata.',
            concepts: ['Perkalian', 'Operasi hitung', 'Konteks nyata'],
            benefit: 'Siswa memahami perkalian melalui konteks proses produksi kain budaya.'
          }
        ],
        funFacts: [
          {
            icon: 'timer',
            title: 'Pewarnaan 14 Hari',
            body: 'Proses pewarnaan benang dalam pembuatan Kain Tope Le\'leng membutuhkan waktu 14 hari. Benang direndam setiap pagi dan sore selama 14 hari hingga berubah menjadi hitam pekat, lalu proses pencelupan diulang beberapa kali untuk memastikan warna terserap sempurna.'
          },
          {
            icon: 'auto_awesome',
            title: 'Kerang Laut sebagai Alat Pengkilap',
            body: 'Tahap penyelesaian kain (Anggarusu\') yang unik adalah penggosokan kain dengan kerang laut (keong) untuk menghasilkan kilau khas hitam mengkilap. Sebelumnya, kain dipukul dengan alat berat sekitar 5 kg untuk meratakan serat.'
          },
          {
            icon: 'eco',
            title: 'Pewarna 100% Alami',
            body: 'Kain Tope Le\'leng diwarnai menggunakan bahan-bahan alami: Daun tarung (Indigofera tinctoria), Jeruk nipis (aporo), dan Air abu kayu fermentasi (ahu). Campuran ini menghasilkan cairan berwarna biru tua kehitaman yang mewarnai benang menjadi hitam pekat.'
          }
        ]
      },
      measurement: {
        badge: 'Sistem Pengukuran',
        title: 'Sistem Pengukuran Hasta',
        description: `Masyarakat Kajang menggunakan sistem pengukuran tradisional yang disebut hasta, di mana 1 hasta ≈ 40 cm.

Berdasarkan keterangan penenun:
- Sebelum dijahit, kain berukuran 7 hasta panjang
- Setelah dijahit, kain berukuran 6 hasta panjang dan 3 hasta lebar
- Artinya, ukuran akhir kain: 240 cm × 120 cm

Sistem pengukuran hasta ini digunakan dalam proses Nipaturning (Pemintalan dan Penataan Benang) untuk menghitung jumlah benang yang diperlukan. Jumlah benang selalu ganjil, karena dianggap membawa keseimbangan dan keberuntungan.`,
        heroImage: '../Asset/Images/sistem_pengukuran_hasta.png',
        gallery: [
          {
            src: '../Asset/Images/sistem_pengukuran_hasta1.png',
            title: 'Sistem Pengukuran Hasta',
            caption: 'Pengukuran Tradisional',
            desc: '1 hasta ≈ 40 cm. Sebelum dijahit, kain berukuran 7 hasta panjang. Setelah dijahit, kain berukuran 6 hasta panjang dan 3 hasta lebar, sehingga ukuran akhir kain: 240 cm × 120 cm.',
            math: 'Konversi: 6 hasta × 40 cm = 240 cm (panjang), 3 hasta × 40 cm = 120 cm (lebar). Luas kain = 240 × 120 = 28.800 cm².'
          },
          {
            src: '../Asset/Images/pemintalan_benang_nipaturning.png',
            title: 'Pemintalan Benang — Jumlah Selalu Ganjil',
            caption: 'Bilangan Ganjil',
            desc: 'Jumlah benang yang akan digunakan sebagai dasar pola dihitung. Jumlah benang selalu ganjil, karena dianggap membawa keseimbangan dan keberuntungan.',
            math: 'Bilangan ganjil: 1, 3, 5, 7, 9, ... — bilangan yang tidak habis dibagi 2. Pemilihan bilangan ganjil mencerminkan pemahaman matematika dalam tradisi budaya.'
          }
        ],
        mathConnection: `Sistem pengukuran hasta yang digunakan masyarakat Kajang adalah contoh nyata sistem pengukuran non-standar yang dapat dikonversi ke satuan baku SI.

Konversi Hasta ke Sentimeter:
1 hasta ≈ 40 cm
6 hasta (panjang setelah dijahit) = 6 × 40 = 240 cm
3 hasta (lebar setelah dijahit) = 3 × 40 = 120 cm
7 hasta (panjang sebelum dijahit) = 7 × 40 = 280 cm

Luas Kain:
Luas = panjang × lebar = 240 cm × 120 cm = 28.800 cm²

Bilangan Ganjil dalam Jumlah Benang:
Jumlah benang dasar selalu ganjil. Bilangan ganjil adalah bilangan yang tidak habis dibagi 2: 1, 3, 5, 7, 9, ... Sifat bilangan ganjil + bilangan ganjil = bilangan genap. Pemilihan bilangan ganjil dalam konteks budaya memperlihatkan bahwa pemahaman tentang sifat bilangan telah ada jauh sebelum pendidikan formal.`,
        relatedMaterial: [
          {
            icon: 'straighten',
            name: 'Konversi Satuan Panjang',
            relation: 'Konversi hasta ke sentimeter (1 hasta ≈ 40 cm) berkaitan dengan konversi satuan panjang dalam matematika.',
            concepts: ['Konversi satuan', 'Perkalian', 'Satuan baku dan non-baku'],
            benefit: 'Siswa mampu mengkonversi satuan pengukuran tradisional ke satuan SI.'
          },
          {
            icon: 'calculate',
            name: 'Luas Bangun Datar',
            relation: 'Ukuran kain 240 cm × 120 cm merupakan luas persegi panjang yang dapat dihitung.',
            concepts: ['Luas persegi panjang', 'Perkalian', 'Dimensi'],
            benefit: 'Siswa mampu menghitung luas persegi panjang dari konteks nyata produk budaya.'
          },
          {
            icon: 'calculate',
            name: 'Sifat Bilangan Ganjil',
            relation: 'Penggunaan bilangan ganjil untuk jumlah benang berkaitan dengan sifat-sifat bilangan ganjil dalam matematika.',
            concepts: ['Bilangan ganjil', 'Sifat bilangan', 'Habis dibagi'],
            benefit: 'Siswa memahami sifat bilangan ganjil dari konteks budaya yang autentik.'
          }
        ],
        funFacts: [
          {
            icon: 'straighten',
            title: 'Hasta: Satuan Panjang Berbasis Tubuh',
            body: 'Sistem hasta adalah satuan pengukuran tradisional berbasis tubuh manusia — panjang dari ujung siku hingga ujung jari tengah. Di Kajang, 1 hasta ≈ 40 cm, dan digunakan untuk mengukur kain Tope Le\'leng yang berukuran akhir 240 cm × 120 cm.'
          },
          {
            icon: 'auto_awesome',
            title: 'Ganjil untuk Keseimbangan',
            body: 'Jumlah benang dasar dalam tenun Kajang selalu ganjil karena dianggap membawa keseimbangan dan keberuntungan. Menariknya, dalam matematika, jumlah ganjil benang memang menciptakan simetri yang lebih mudah dalam pola tenun.'
          }
        ]
      },
      structure: {
        badge: 'Struktur Adat',
        title: 'Struktur Adat dan Peran Ammatoa',
        description: `Secara geografis, masyarakat adat suku Kajang terbagi menjadi dua: Kajang Dalam (Ilalang Embayya) — mereka yang masih mempertahankan ajaran leluhur dan hidup di kawasan adat dengan aturan ketat; dan Kajang Luar (Ipantarang Embayya) — mereka yang tinggal di luar kawasan adat dan telah menerima teknologi.

Ammatoa adalah pemimpin adat tertinggi yang diyakini memiliki sejumlah kekuatan dan kemuliaan (niturungi pangngellai). Tidak sembarang orang bisa menjadi Ammatoa. Bagi masyarakat adat Kajang, ia adalah orang yang turun dari langit (To Manurung) dan sekaligus orang yang pertama yang turun di daerah Tanatowa.

Secara harfiah, istilah "Ammatoa" berarti "seorang bapak yang dituakan". Ia memiliki pandangan dan pengetahuan yang luas sehingga mampu mengambil keputusan yang bijak atas berbagai masalah.

Fungsi dan Peran Ammatoa: (1) Sebagai pelindung dan pengayom masyarakat adat, termasuk hutan yang dikeramatkan (Borong Karamaka); (2) Sebagai penghubung spiritual dengan Turi'e A'ra'na (Tuhan); (3) Sebagai penegak hukum dan ajaran adat (Pasang ri Kajang).

Pemilihan Ammatoa dilakukan melalui ritual adat A'nganro atau proses adat Pasang yang bersifat spiritual dan sakral bukan melalui voting. Pemilihan ini melibatkan doa serta kepercayaan bahwa pemimpin dipilih oleh alam dan leluhur.`,
        heroImage: '../Asset/Images/ammatoa_pemimpin_tertinggi.png',
        gallery: [
          {
            src: '../Asset/Images/ammatoa_pemimpin_tertinggi.png',
            title: 'Ammatoa: Pemimpin Tertinggi',
            caption: 'Pemimpin Adat',
            desc: 'Ammatoa adalah pemimpin adat tertinggi yang diyakini memiliki sejumlah kekuatan dan kemuliaan (niturungi pangngellai). Istilah "Ammatoa" berarti "seorang bapak yang dituakan".',
            math: ''
          },
          {
            src: '../Asset/Images/rumah_adat_kajang.png',
            title: 'Rumah Adat Kajang',
            caption: 'Wilayah Adat',
            desc: 'Kawasan adat Kajang terbagi menjadi Kajang Dalam (Ilalang Embayya) yang mempertahankan ajaran leluhur, dan Kajang Luar (Ipantarang Embayya) yang telah menerima teknologi.',
            math: ''
          }
        ],
        mathConnection: `Pembagian wilayah adat Kajang menjadi Kajang Dalam (Ilalang Embayya) dan Kajang Luar (Ipantarang Embayya) mencerminkan konsep pembagian himpunan dalam matematika — dua himpunan yang berbeda namun tetap dalam satu kesatuan komunitas Kajang.

Tiga fungsi utama Ammatoa (pelindung, penghubung spiritual, penegak hukum) juga mencerminkan konsep tiga elemen dalam suatu sistem — sebuah pemahaman struktural yang relevan dengan konsep himpunan dalam matematika.`,
        relatedMaterial: [
          {
            icon: 'account_tree',
            name: 'Himpunan',
            relation: 'Pembagian Kajang Dalam dan Kajang Luar mencerminkan konsep pembagian himpunan dalam matematika.',
            concepts: ['Himpunan bagian', 'Irisan', 'Gabungan'],
            benefit: 'Siswa memahami konsep himpunan dari konteks pembagian wilayah adat yang nyata.'
          }
        ],
        funFacts: [
          {
            icon: 'history_edu',
            title: 'Ammatoa: Bapak yang Dituakan',
            body: 'Secara harfiah, istilah "Ammatoa" berarti "seorang bapak yang dituakan". Ia diyakini memiliki sejumlah kekuatan dan kemuliaan (niturungi pangngellai) dan dipilih melalui ritual adat A\'nganro atau proses Pasang yang bersifat spiritual dan sakral, bukan melalui voting.'
          },
          {
            icon: 'eco',
            title: 'Borong Karamaka: Hutan Keramat',
            body: 'Salah satu fungsi Ammatoa adalah melindungi hutan yang dikeramatkan (Borong Karamaka). Perlindungan hutan ini bukan hanya spiritual tetapi juga ekologis — menjaga keseimbangan alam yang merupakan bagian dari filosofi Pasang ri Kajang.'
          }
        ]
      },
      tools: {
        badge: 'Alat Tenun',
        title: 'Alat dan Perlengkapan Tenun',
        description: `Dalam proses Pattannungan, penenun menggunakan berbagai alat tradisional. Berikut adalah daftar alat dan fungsinya:

- Pappakang: Alat dasar tenun
- Panggepe: Penahan benang
- Balira: Pengatur ketegangan
- Tumpa: Alat penenun
- Pappasolongang: Penjaga jarak
- Panja'jala: Alat bantu
- Pakkarakang: Pengatur pola
- Kara: Alat pemadat
- Taropong: Penggulung kain
- Bu'rung: Alat bantu
- Suru': Pengatur benang
- Boko-boko: Alat pemisah
- Sissiri: Alat penghalus
- Pari': Alat bantu
- Api': Alat penenun

Proses menenun Kain Tope Le'leng dilakukan sepenuhnya dengan tangan menggunakan alat-alat tradisional ini. Waktu yang dibutuhkan: 1-2 minggu jika dilakukan setiap hari, atau hingga 1 bulan jika dilakukan di waktu senggang.`,
        heroImage: '../Asset/Images/alat_perlengkapan_tenun.png',
        gallery: [
          {
            src: '../Asset/Images/alat_perlengkapan_tenun.png',
            title: 'Alat dan Perlengkapan Tenun Tradisional',
            caption: 'Peralatan Pattannungan',
            desc: 'Dalam proses Pattannungan, penenun menggunakan 15 jenis alat tradisional, dari Pappakang sebagai alat dasar tenun hingga Api\' sebagai alat penenun.',
            math: 'Terdapat 15 jenis alat tenun yang digunakan — sebuah data yang dapat dianalisis dan dikategorikan berdasarkan fungsinya.'
          },
          {
            src: '../Asset/Images/proses_menenun_pattannungan.png',
            title: 'Proses Menenun dengan Alat Tradisional',
            caption: 'Pattannungan',
            desc: 'Proses menenun Kain Tope Le\'leng dilakukan sepenuhnya dengan tangan. Waktu yang dibutuhkan: 1-2 minggu jika setiap hari, hingga 1 bulan jika di waktu senggang.',
            math: 'Perbandingan waktu: 1-2 minggu vs 1 bulan. Jika 1 bulan = ±4 minggu, maka rasio waktu adalah 1:2 hingga 1:4 dibanding pengerjaan rutin.'
          }
        ],
        mathConnection: `Alat-alat tenun tradisional Kajang dapat dikategorikan berdasarkan fungsinya, yang merupakan penerapan konsep pengelompokan dan klasifikasi dalam matematika.

Jumlah alat tenun: 15 jenis alat yang masing-masing memiliki fungsi spesifik. Ini dapat dijadikan dasar analisis data sederhana — menghitung jumlah, mengkategorikan berdasarkan fungsi, dan membuat diagram.

Waktu pengerjaan: Kain dapat diselesaikan dalam 1-2 minggu (jika dikerjakan setiap hari) atau hingga 1 bulan (jika dikerjakan di waktu senggang). Perbandingan ini melibatkan konsep rasio dan perbandingan waktu.`,
        relatedMaterial: [
          {
            icon: 'bar_chart',
            name: 'Pengolahan Data',
            relation: 'Data 15 alat tenun dengan fungsinya dapat diolah menggunakan konsep statistika dasar.',
            concepts: ['Pengumpulan data', 'Klasifikasi', 'Diagram'],
            benefit: 'Siswa mampu mengklasifikasikan dan menyajikan data alat tenun dalam diagram yang tepat.'
          },
          {
            icon: 'straighten',
            name: 'Perbandingan',
            relation: 'Perbandingan waktu pengerjaan kain (1-2 minggu vs 1 bulan) melibatkan konsep rasio dan perbandingan.',
            concepts: ['Rasio', 'Perbandingan waktu', 'Konversi satuan waktu'],
            benefit: 'Siswa memahami perbandingan dari konteks nyata proses produksi budaya.'
          }
        ],
        funFacts: [
          {
            icon: 'auto_awesome',
            title: '15 Alat Tradisional',
            body: 'Dalam proses Pattannungan, penenun Kajang menggunakan tidak kurang dari 15 jenis alat tradisional — dari Pappakang sebagai alat dasar tenun hingga Api\' sebagai alat penenun. Setiap alat memiliki fungsi yang sangat spesifik dalam menghasilkan kain yang berkualitas.'
          },
          {
            icon: 'timer',
            title: 'Satu Kain, Berminggu-minggu Pengerjaan',
            body: 'Satu lembar Kain Tope Le\'leng membutuhkan waktu 1-2 minggu jika dikerjakan setiap hari, atau hingga 1 bulan jika dikerjakan di waktu senggang. Ini menunjukkan betapa tingginya nilai kerja keras dan ketekunan dalam tradisi tenun Kajang.'
          }
        ]
      }
    };

    /* =================================================================
       RENDER FUNCTIONS
    ================================================================= */

    function renderGallery(galleryData) {
      const container = document.getElementById('gallery');
      if (!galleryData || !galleryData.length) {
        container.innerHTML = '<p class="text-sm text-on-surface-variant col-span-2">Galeri belum tersedia.</p>';
        return;
      }
      container.innerHTML = galleryData.map(function (item) {
        if (item.isMap) {
          return `<div class="gallery-card overflow-hidden min-h-[340px] md:min-h-[380px] h-full flex flex-col">
              <div class="px-4 py-2.5 bg-white border-b border-outline-variant flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-base">location_on</span>
                <span class="gallery-card-title text-sm font-bold text-primary">${item.title || 'Lokasi Desa Adat Ammatoa Kajang'}</span>
              </div>
              <iframe 
                src="${item.mapUrl || 'https://maps.google.com/maps?q=Desa+Adat+Ammatoa+Kajang&t=&z=15&ie=UTF8&iwloc=&output=embed'}" 
                class="w-full flex-1 border-0" 
                style="border:0; width:100%; height:100%; min-height:300px;" 
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade">
              </iframe>
            </div>`;
        }

        const hasSrc = item.src && item.src.trim() !== '';
        const imgTag = hasSrc
          ? `<img src="${item.src}" alt="${item.title}" loading="lazy" onerror="this.src='https://placehold.co/600x450/eef4ff/003527?text=Gambar+Belum+Tersedia'; this.onerror=null;" />`
          : `<div style="aspect-ratio:4/3;background:#e5eeff;display:flex;align-items:center;justify-content:center;">
                 <span class="material-symbols-outlined" style="font-size:2.5rem;color:#bfc9c3;">image</span>
               </div>`;

        const mathRow = item.math
          ? `<div class="gallery-card-math">
                 <span class="material-symbols-outlined">function</span>
                 <span>${item.math}</span>
               </div>`
          : '';

        return `<div class="gallery-card">
            ${imgTag}
            <div class="gallery-card-body">
              <div class="gallery-card-caption">${item.caption || ''}</div>
              <div class="gallery-card-title">${item.title}</div>
              <div class="gallery-card-desc">${item.desc || ''}</div>
              ${mathRow}
            </div>
          </div>`;
      }).join('');
    }

    function renderMathConnection(text) {
      const container = document.getElementById('math-connection');
      if (!text) { container.textContent = '—'; return; }
      const paragraphs = text.split(/\n\n+/).map(function (p) {
        return '<p style="margin-bottom:1rem;last-child:margin-bottom:0">' + p.trim().replace(/\n/g, '<br>') + '</p>';
      });
      container.innerHTML = paragraphs.join('');
    }

    function renderRelatedMaterial(materials) {
      const container = document.getElementById('related-material');
      if (!materials || !materials.length) {
        container.innerHTML = '<li class="text-sm text-on-surface-variant">Tidak ada materi terkait.</li>';
        return;
      }
      container.innerHTML = materials.map(function (m) {
        const chips = (m.concepts || []).map(function (c) {
          return '<span class="concept-chip">' + c + '</span>';
        }).join('');

        return `<li class="related-card">
            <div class="related-card-header">
              <div class="related-card-icon">
                <span class="material-symbols-outlined">${m.icon || 'school'}</span>
              </div>
              <div class="related-card-name">${m.name}</div>
            </div>
            <div class="related-card-relation">${m.relation}</div>
            ${chips ? '<div class="related-card-concepts">' + chips + '</div>' : ''}
            ${m.benefit ? '<div class="related-card-relation" style="font-size:0.75rem;margin-top:0.25rem;"><strong style="color:#003527">Manfaat:</strong> ' + m.benefit + '</div>' : ''}
            <a class="related-card-btn" href="Materi.html?materi=${encodeURIComponent(m.name)}">
              <span class="material-symbols-outlined">open_in_new</span>
              Pelajari Materi
            </a>
          </li>`;
      }).join('');
    }

    function renderFunFacts(facts) {
      const container = document.getElementById('fun-facts');
      if (!facts || !facts.length) {
        container.innerHTML = '<li class="text-sm text-on-surface-variant">Belum ada fakta menarik.</li>';
        return;
      }
      container.innerHTML = facts.map(function (f) {
        if (typeof f === 'string') {
          return `<li class="fact-card">
              <div class="fact-icon"><span class="material-symbols-outlined">auto_awesome</span></div>
              <div class="fact-content"><p class="fact-body">${f}</p></div>
            </li>`;
        }
        return `<li class="fact-card">
            <div class="fact-icon"><span class="material-symbols-outlined">${f.icon || 'auto_awesome'}</span></div>
            <div class="fact-content">
              ${f.title ? '<p class="fact-title">' + f.title + '</p>' : ''}
              ${f.body ? '<p class="fact-body">' + f.body + '</p>' : ''}
            </div>
          </li>`;
      }).join('');
    }

    function renderDescription(text) {
      const container = document.getElementById('topic-description');
      if (!text) { container.textContent = ''; return; }
      const paragraphs = text.split(/\n\n+/).map(function (p) {
        return '<p style="margin-bottom:1rem">' + p.trim().replace(/\n/g, '<br>') + '</p>';
      });
      container.innerHTML = paragraphs.join('');
    }

    /* =================================================================
       INIT — memuat data berdasarkan parameter URL
    ================================================================= */
    (function init() {
      console.log('=== DEBUG: INIT BUDAYA-DETAIL ===');
      console.log('window.location.href:', window.location.href);
      console.log('window.location.search:', window.location.search);

      const params = new URLSearchParams(window.location.search);
      let topicKey = params.get('topic');

      // FALLBACK: Jika parameter tidak ada, coba ambil dari localStorage
      if (!topicKey) {
        topicKey = localStorage.getItem('budaya_topic');
        console.log('topicKey dari localStorage:', topicKey);
      }

      console.log('topicKey akhir:', topicKey);
      console.log('topics keys yang tersedia:', Object.keys(topics));

      const isValidTopic = topicKey && topics[topicKey];
      console.log('isValidTopic:', isValidTopic);

      let topic;
      if (isValidTopic) {
        topic = topics[topicKey];
        console.log('TOPIC TERPILIH:', topicKey);
      } else {
        topic = topics.history;
        console.log('TOPIC FALLBACK (history)');
      }

      document.getElementById('crumb').textContent = topic.badge;
      document.getElementById('topic-badge').textContent = topic.badge;
      document.getElementById('topic-title').textContent = topic.title;
      document.title = topic.title + ' | KANUM';

      const img = document.getElementById('hero-image');
      img.src = topic.heroImage;
      img.alt = topic.title;

      renderDescription(topic.description);
      renderGallery(topic.gallery);
      renderMathConnection(topic.mathConnection);
      renderRelatedMaterial(topic.relatedMaterial);
      renderFunFacts(topic.funFacts);
    })();


})();

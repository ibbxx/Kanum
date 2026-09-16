import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-surface">
      <nav className="sticky top-0 z-50 bg-white border-b border-outline-variant px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-primary font-semibold text-sm">
          ← Kembali
        </Link>
        <span className="font-display font-bold text-primary text-sm">KANUM</span>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-12 space-y-8 text-sm leading-relaxed">
        <h1 className="font-display text-3xl font-bold text-primary">Kebijakan Privasi</h1>
        <p className="text-on-surface-variant">Terakhir diperbarui: Januari 2025</p>
        <section>
          <h2 className="font-bold text-lg text-primary mb-3">1. Informasi yang Kami Kumpulkan</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Data akun: nama lengkap, alamat email, kelas/role.</li>
            <li>Data aktivitas: hasil latihan, jawaban soal, skor, dan waktu pengerjaan.</li>
            <li>Data teknis: jenis perangkat dan browser.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-lg text-primary mb-3">2. Penggunaan Data</h2>
          <p>Data digunakan untuk layanan pembelajaran, laporan progres, penelitian akademik, dan peningkatan platform.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg text-primary mb-3">3. Penyimpanan Data</h2>
          <p>Data disimpan di Supabase dengan enkripsi standar industri. Data tidak dijual kepada pihak ketiga komersial.</p>
        </section>
        <section>
          <h2 className="font-bold text-lg text-primary mb-3">4. Hak Pengguna</h2>
          <p>Anda dapat memperbarui profil di halaman Pengaturan atau meminta penghapusan akun kepada administrator.</p>
        </section>
      </main>
    </div>
  );
}

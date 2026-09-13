import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 bg-white border-b border-outline-variant px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-primary font-semibold text-sm">
          ← Kembali
        </Link>
        <span className="font-display font-bold text-primary text-sm">KANUM</span>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-12 space-y-8 text-sm leading-relaxed">
        <h1 className="font-display text-3xl font-bold text-primary">Syarat & Ketentuan</h1>
        <p className="text-on-surface-variant">Terakhir diperbarui: Januari 2025</p>
        <section>
          <h2 className="font-bold text-lg text-primary mb-3">1. Penerimaan Ketentuan</h2>
          <p>
            Dengan mendaftar dan menggunakan KANUM, Anda menyetujui ketentuan ini. Platform ini
            ditujukan untuk pembelajaran dan penelitian etnomatematika Ammatoa Kajang.
          </p>
        </section>
        <section>
          <h2 className="font-bold text-lg text-primary mb-3">2. Penggunaan Platform</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Hanya untuk keperluan pembelajaran dan penelitian.</li>
            <li>Dilarang menyalahgunakan akun atau merugikan pengguna lain.</li>
            <li>Pengguna bertanggung jawab atas aktivitas akunnya.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold text-lg text-primary mb-3">3. Siswa dan Guru</h2>
          <p>
            Siswa berhak mengakses materi, budaya, dan latihan yang dipublikasikan. Guru mengelola
            konten dan melihat progres siswa.
          </p>
        </section>
      </main>
    </div>
  );
}

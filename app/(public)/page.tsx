import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SmartImage } from "@/components/SmartImage";

export default function LandingPage() {
  return (
    <div>
      <header className="sticky top-0 z-40 bg-surface border-b border-outline-variant">
        <nav className="flex justify-between items-center w-full px-gutter py-stack-sm max-w-container-max mx-auto h-20">
          <span className="font-headline-sm text-headline-sm text-primary font-bold">
            KANUM
          </span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#fitur" className="font-body-md text-on-surface-variant hover:text-primary">
              Fitur
            </a>
            <a href="#budaya" className="font-body-md text-on-surface-variant hover:text-primary">
              Tentang
            </a>
            <Link
              href="/login"
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md hover:opacity-90"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="border border-primary text-primary px-6 py-2.5 rounded-lg font-label-md hover:bg-primary-fixed/40"
            >
              Daftar
            </Link>
          </div>
          <Link href="/login" className="md:hidden text-primary">
            <Icon name="menu" />
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative pt-24 pb-32 overflow-hidden px-gutter">
          <div className="absolute inset-0 ammatoa-pattern pointer-events-none bg-primary" />
          <div className="max-w-container-max mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-label-md font-label-md mb-6">
                <Icon name="auto_awesome" className="text-[16px]" filled />
                Platform Edukasi Budaya Modern
              </span>
              <h1 className="font-display-lg text-display-lg text-on-background mb-6 leading-tight">
                Belajar Matematika Lewat Budaya{" "}
                <span className="text-primary">Ammatoa Kajang</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-lg">
                Numerasi jadi lebih bermakna & membumi. Temukan harmoni antara geometri modern dan kearifan lokal Tope&apos; Le&apos;Leng.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/daftar"
                  className="bg-primary text-on-primary px-8 py-4 rounded-xl font-headline-sm shadow-lg shadow-primary/20"
                >
                  Mulai Belajar
                </Link>
                <a
                  href="#budaya"
                  className="bg-surface-container-low border border-secondary text-secondary px-8 py-4 rounded-xl font-headline-sm"
                >
                  Pelajari Lebih
                </a>
              </div>
            </div>
            <div className="relative w-full aspect-square">
              <div className="absolute inset-0 bg-primary-container/5 rounded-[40px] rotate-3" />
              <div className="absolute inset-0 bg-surface rounded-[40px] border border-outline-variant shadow-sm flex items-center justify-center p-8">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  <SmartImage
                    src="/Asset/Images/Kaintope.png"
                    alt="Kain Tope"
                    priority
                    className="object-cover"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-xl">
                    <p className="text-label-md font-label-md text-primary">Modul Aktif</p>
                    <p className="text-body-sm font-bold">Simetri Lipat dalam Tenunan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="cultural-divider w-full" />

        <section className="py-stack-lg px-gutter max-w-container-max mx-auto" id="fitur">
          <div className="text-center mb-16">
            <h2 className="font-headline-md text-headline-md mb-4">Metode Belajar Terintegrasi</h2>
            <div className="h-1 w-20 bg-secondary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              ["menu_book", "Materi Kontekstual", "Kurikulum matematika yang diintegrasikan langsung dengan motif kain Tope' Le'Leng."],
              ["museum", "Ensiklopedia Budaya", "Jelajahi kearifan lokal suku Ammatoa melalui galeri digital interaktif."],
              ["quiz", "Evaluasi Adaptif", "Uji pemahamanmu dengan tantangan numerasi yang mengasah logika dan kepekaan budaya."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="p-8 bg-white border border-slate-100 rounded-[24px]">
                <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6">
                  <Icon name={icon} className="text-primary text-3xl" />
                </div>
                <h3 className="font-headline-sm mb-3">{title}</h3>
                <p className="text-on-surface-variant">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-24 bg-surface-container-low px-gutter" id="budaya">
          <div className="max-w-container-max mx-auto flex flex-col md:flex-row gap-16 items-center">
            <div className="w-full md:w-1/2">
              <div className="relative aspect-[4/3] rounded-2xl shadow-lg overflow-hidden">
                <SmartImage
                  src="/Asset/Images/Kaintenunmotifputih.png"
                  alt="Tope Le'Leng"
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="font-display-lg text-headline-md md:text-display-lg text-primary mb-6">
                Tentang Etnomatematika Tope&apos; Le&apos;Leng
              </h2>
              <p className="font-body-lg text-on-surface-variant mb-6">
                Kain <strong>Tope&apos; Le&apos;Leng</strong> bukan sekadar pakaian adat. Di balik tenunannya tersimpan konsep geometri, simetri, dan pola yang diwariskan turun-temurun.
              </p>
              <p className="italic text-on-surface-variant">
                &quot;Kamase-masea adalah filosofi hidup bersahaja yang tercermin dalam presisi matematis tenunan kami.&quot;
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 px-gutter">
          <div className="max-w-4xl mx-auto bg-primary rounded-[40px] p-12 text-center">
            <h2 className="font-display-lg text-display-lg text-on-primary mb-6">
              Siap Menjelajahi Harmoni Matematika & Budaya?
            </h2>
            <Link
              href="/daftar"
              className="inline-block bg-secondary-container text-on-secondary-container px-10 py-5 rounded-2xl font-headline-md"
            >
              Mulai Belajar Sekarang
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-inverse-surface text-inverse-on-surface pt-20 pb-10 px-gutter">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between gap-8">
          <p className="opacity-70 text-sm">© 2026 KANUM. Hak Cipta Dilindungi.</p>
          <div className="flex gap-6 text-sm opacity-80">
            <Link href="/privacy">Kebijakan Privasi</Link>
            <Link href="/terms">Syarat & Ketentuan</Link>
            <Link href="/login">Masuk</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

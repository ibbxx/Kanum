import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import { IconGate } from "@/components/IconGate";
import "./globals.css";

// Font self-hosted via next/font: CSS+woff2 di-bundle lokal (dulu: <link>
// ke fonts.googleapis.com yang render-blocking di setiap halaman).
//
// VARIABLE FONT: `weight` sengaja TIDAK didaftar agar Google mengirim SATU
// file variable per keluarga (semua bobot 200–800) alih-alih 9 file statis
// (400/500/600/700/800 × 2 keluarga = ±271 kB). Bobot teks di UI tetap
// dikendalikan utility Tailwind (font-medium/semibold/bold/extrabold) dan
// dipetakan ke sumbu wght — hasil visual di bobot yang sama tidak berubah.
// `font-display: swap` + subset latin dipertahankan apa adanya.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KANUM | Belajar Matematika Melalui Budaya",
  description:
    "Platform etnomatematika Ammatoa Kajang untuk numerasi siswa SMP.",
  // Ikon peramban (rel=icon) diunduh browser di SETIAP pemuatan halaman
  // dingin. Sebelumnya yang dideklarasikan adalah /icon.png berukuran
  // 1330×1182 (355 kB!) — berkas itu ikut terunduh setiap kali halaman dibuka
  // walaupun hanya ditampilkan 16–32 px di tab. Sekarang yang dideklarasikan
  // adalah turunan kecil dari artwork YANG SAMA:
  //   - /favicon.ico    32×32, 1,5 kB (sudah ada, sebelumnya tak terpakai)
  //   - /favicon-128.png 128×128, 3,9 kB (kuadrat, art di tengah, tanpa
  //                     distorsi/crop — untuk tab HiDPI)
  // Artwork asli (/icon.png, /apple-touch-icon.png) TIDAK diubah dan tetap
  // dipakai untuk keperluan ikon aplikasi (apple-touch-icon hanya diminta
  // iOS saat "Add to Home Screen", bukan saat membuka halaman).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-128.png", type: "image/png", sizes: "128x128" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`light ${plusJakarta.variable} ${inter.variable}`}>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {/* Font ikon Material Symbols kini self-hosted lewat @font-face di
            globals.css (/fonts/material-symbols-outlined.woff2) — sama seperti
            font teks. Tidak ada lagi stylesheet pihak ketiga yang
            render-blocking, dan tidak ada lagi ketergantungan pada CDN untuk
            seluruh ikon aplikasi. */}
      </head>
      <body className="bg-background text-on-background font-body-md min-h-[100dvh] antialiased">
        <ToastProvider>
          <IconGate />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import { IconGate } from "@/components/IconGate";
import "./globals.css";

// Font self-hosted via next/font: CSS+woff2 di-bundle lokal (dulu: <link>
// ke fonts.googleapis.com yang render-blocking di setiap halaman).
// Subset latin + weight yang sama seperti daftar lama.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KANUM | Belajar Matematika Melalui Budaya",
  description:
    "Platform etnomatematika Ammatoa Kajang untuk numerasi siswa SMP.",
  icons: {
    icon: "/icon.png",
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
        {/* Material Symbols tetap via CDN (hanya glyph icon font, kecil
            dan di-cache panjang); teks sudah self-hosted di bawah. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background font-body-md min-h-screen antialiased">
        <ToastProvider>
          <IconGate />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

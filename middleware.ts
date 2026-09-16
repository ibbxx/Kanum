import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /*
   * Middleware hanya dijalankan untuk PERMINTAAN HALAMAN.
   *
   * Sebelumnya matcher hanya mengecualikan _next/static, _next/image,
   * favicon.ico, Asset/, dan beberapa ekstensi gambar — sehingga permintaan
   * aset lain seperti /fonts/material-symbols-outlined.woff2, /icon.png,
   * /apple-touch-icon.png, atau berkas .map masih melewati updateSession:
   * middleware membuat Supabase client dan memeriksa sesi untuk setiap
   * permintaan berkas statis yang sama sekali tidak butuh auth (pekerjaan
   * server + edge function invocation yang mubazir, dan ikut terhitung di
   * metrik middleware Vercel).
   *
   * Daftar di bawah menutup semua aset statis (folder publik + ekstensi
   * berkas) tanpa mengubah perilaku routing halaman mana pun: seluruh rute
   * aplikasi tidak bersufiks ekstensi berkas.
   */
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|Asset/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|map|txt|xml|webmanifest|mp4|webm|pdf)$).*)",
  ],
};

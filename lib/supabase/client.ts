import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Identitas user dari SESI LOKAL (cookie yang sudah ada) — tanpa memanggil
 * endpoint /auth/v1/user di jaringan.
 *
 * `supabase.auth.getUser()` adalah verifikasi token ke server Supabase: satu
 * roundtrip HTTP (~100–300 ms) yang harus selesai SEBELUM aksi apa pun berjalan
 * — padahal setiap tulis ke database/storage sudah membawa token yang sama dan
 * tetap ditegakkan RLS/Storage policy di server. Untuk keperluan mengisi kolom
 * identitas (created_by, teacher_id, student_id, prefix path storage) hasilnya
 * identik, hanya tanpa menunggu jaringan dua kali. `getSession()` tetap
 * me-refresh token yang kedaluwarsa dan mengembalikan null bila sesi memang
 * sudah tidak ada, jadi penanganan error di pemanggil tidak berubah.
 */
export async function getSessionUser(
  supabase = createClient()
): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

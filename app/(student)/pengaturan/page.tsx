import { getProfile } from "@/lib/profile";
import { SettingsForm } from "./SettingsForm";

export default async function PengaturanPage() {
  /**
   * Layout siswa pada request yang sama SUDAH memanggil getProfile() — dan
   * getProfile() di-memo per request (React cache), jadi panggilan di sini
   * tidak menambah query ke Supabase sama sekali. Nilainya diteruskan ke
   * form supaya form tidak perlu mengambil profil yang sama untuk KEDUA
   * kalinya dari browser setelah mount (dulu: satu request Supabase +
   * render form kosong dulu, baru terisi).
   */
  const profile = await getProfile();
  return (
    <div>
      <h1 className="font-headline-md text-primary mb-6">Pengaturan</h1>
      <SettingsForm profile={profile} />
    </div>
  );
}

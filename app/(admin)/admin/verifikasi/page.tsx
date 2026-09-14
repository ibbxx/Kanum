import { VerifikasiPanel } from "@/components/VerifikasiPanel";

export const dynamic = "force-dynamic";

export default function VerifikasiAdminPage() {
  return (
    <div>
      <p className="text-sm text-on-surface-variant mb-4">
        Pengajuan akun Guru yang menunggu verifikasi Anda. Siswa langsung
        aktif tanpa verifikasi; hanya Admin yang berwenang menyetujui guru.
      </p>
      <VerifikasiPanel />
    </div>
  );
}

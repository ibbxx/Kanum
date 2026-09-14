import { VerifikasiPanel } from "@/components/VerifikasiPanel";

export const dynamic = "force-dynamic";

export default function VerifikasiGuruPage() {
  return (
    <div>
      <p className="text-sm text-on-surface-variant mb-4">
        Pengajuan akun siswa yang menunggu persetujuan Anda. Setujui siswa yang
        Anda kenal; pengajuan guru hanya dapat diverifikasi oleh Admin.
      </p>
      <VerifikasiPanel />
    </div>
  );
}

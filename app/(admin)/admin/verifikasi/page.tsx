import { VerifikasiPanel } from "@/components/VerifikasiPanel";

export const dynamic = "force-dynamic";

export default function VerifikasiAdminPage() {
  return (
    <div>
      <p className="text-sm text-on-surface-variant mb-4">
        Semua pengajuan akun yang menunggu verifikasi: siswa (bisa juga
        diverifikasi guru pengampu) dan guru (hanya Admin yang berwenang).
      </p>
      <VerifikasiPanel />
    </div>
  );
}

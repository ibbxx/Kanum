import { Suspense } from "react";
import { SoalAdmin } from "@/app/(admin)/admin/soal/SoalAdmin";

export default function Page() {
  return (
    <Suspense fallback={<p>Memuat...</p>}>
      <SoalAdmin basePath="/guru/soal" />
    </Suspense>
  );
}

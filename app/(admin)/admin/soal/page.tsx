import { Suspense } from "react";
import { SoalAdmin } from "./SoalAdmin";

export default function Page() {
  return (
    <Suspense fallback={<p>Memuat...</p>}>
      <SoalAdmin />
    </Suspense>
  );
}

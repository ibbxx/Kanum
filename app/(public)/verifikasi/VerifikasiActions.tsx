"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";

/** Tombol ajukan ulang setelah ditolak — RPC resubmit_verification. */
export function ResubmitButton() {
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resubmit() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("resubmit_verification");
    setLoading(false);
    if (error) {
      showToast("Gagal mengajukan ulang: " + error.message, "error");
      return;
    }
    showToast("Pengajuan ulang terkirim. Menunggu verifikasi.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void resubmit()}
      disabled={loading}
      className="mt-6 inline-flex items-center gap-2 bg-primary text-on-primary font-bold py-3 px-6 rounded-xl"
    >
      <Icon name="restart_alt" className="text-[18px]" />
      {loading ? "Mengirim..." : "Ajukan Ulang"}
    </button>
  );
}

/**
 * Muat ulang data server agar status terbaru tampil sendiri saat halaman
 * ditinggalkan terbuka. Interval cukup longgar (2 menit): perubahan status
 * tetap muncul tanpa router.refresh() tiap 15 detik — refresh memicu
 * render ulang server + query Supabase dan mengganggu navigasi berikutnya.
 */
export function StatusPoller({ intervalMs = 120000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}

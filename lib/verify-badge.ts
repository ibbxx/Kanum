import { createClient } from "@/lib/supabase/client";

/**
 * Badge jumlah pengajuan pending untuk AdminShell — dibagi satu instance
 * untuk seluruh sesi:
 * - `refresh()` memanggil RPC list_verification_queue SEKALI (dedup bila
 *   sudah berjalan), lalu menyiarkan hasil ke semua listener.
 * - Realtime postgres_changes pada tabel profiles memicu refresh hanya
 *   ketika baris benar-benar berubah (insert/update/delete pengajuan) —
 *   dulu RPC dipanggil ulang pada SETIAP perpindahan halaman.
 */
type Listener = (count: number) => void;

let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
let refCount = 0;
const listeners = new Set<Listener>();
let fetching: Promise<void> | null = null;

function broadcast(count: number) {
  listeners.forEach((l) => l(count));
}

async function fetchCount(): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_verification_queue");
  if (error) return; // biarkan nilai terakhir; jangan flicker ke 0
  broadcast((data as unknown[] | null)?.length ?? 0);
}

function ensureChannel() {
  if (channel) return;
  const supabase = createClient();
  channel = supabase
    .channel("kanum-verify-badge")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles" },
      () => {
        void refresh();
      }
    )
    .subscribe();
}

export function subscribeToVerificationQueue(listener: Listener): {
  refresh: () => Promise<void>;
  cleanup: () => void;
} {
  listeners.add(listener);
  refCount += 1;
  ensureChannel();

  return {
    refresh: () => refresh(),
    cleanup() {
      listeners.delete(listener);
      refCount -= 1;
      if (refCount <= 0 && channel) {
        const supabase = createClient();
        void supabase.removeChannel(channel);
        channel = null;
        refCount = 0;
      }
    },
  };
}

export function refresh(): Promise<void> {
  if (!fetching) {
    fetching = fetchCount().finally(() => {
      fetching = null;
    });
  }
  return fetching;
}

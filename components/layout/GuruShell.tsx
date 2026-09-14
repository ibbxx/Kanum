"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const nav = [
  { href: "/guru", icon: "dashboard", label: "Dashboard Guru" },
  { href: "/guru/verifikasi", icon: "how_to_reg", label: "Verifikasi Siswa" },
  { href: "/guru/kelas", icon: "groups", label: "Kelas Saya" },
  { href: "/guru/latihan", icon: "edit_square", label: "Latihan" },
  { href: "/guru/soal", icon: "quiz", label: "Soal" },
  { href: "/guru/progres", icon: "leaderboard", label: "Progres Siswa" },
  { href: "/guru/materi", icon: "menu_book", label: "Materi" },
  { href: "/guru/budaya", icon: "museum", label: "Budaya" },
];

const titles: Record<string, string> = {
  "/guru": "Dashboard Guru",
  "/guru/verifikasi": "Verifikasi Siswa",
  "/guru/kelas": "Kelas Saya",
  "/guru/latihan": "Latihan",
  "/guru/soal": "Soal",
  "/guru/progres": "Progres Siswa",
  "/guru/materi": "Materi",
  "/guru/budaya": "Budaya",
};

export function GuruShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const name = profile?.full_name || "Guru";
  const title =
    titles[pathname] ||
    (pathname.startsWith("/guru/soal") ? "Soal" : "Panel Guru");

  // Jumlah pengajuan siswa pending (badge nav). RPC membatasi ke yang
  // berwenang — guru hanya menghitung pengajuan siswa.
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    const supabase = createClient();
    void supabase
      .rpc("list_verification_queue")
      .then(({ data }) => setPendingCount((data as unknown[] | null)?.length ?? 0));
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-[60] w-64 hidden md:flex flex-col border-r border-outline-variant bg-white">
        <div className="flex min-h-full flex-col p-8">
          <div className="mb-6">
            <span className="block font-display text-2xl font-extrabold text-primary">
              KANUM
            </span>
            <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full">
              Guru
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            {nav.map((item) => {
              const active =
                item.href === "/guru"
                  ? pathname === "/guru"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 min-h-12 rounded-xl px-4 py-3 text-sm font-bold",
                    active
                      ? "text-white bg-primary-container shadow-md"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                  )}
                >
                  <Icon name={item.icon} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/guru/verifikasi" && pendingCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-error text-white text-[11px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <LogoutButton className="mt-auto flex items-center gap-3 min-h-12 rounded-xl px-4 py-3 text-sm font-bold text-on-surface-variant hover:text-error hover:bg-error-container" />
        </div>
      </aside>

      <header className="fixed top-0 right-0 left-0 md:left-64 z-50 border-b border-outline-variant bg-surface/90 backdrop-blur">
        <div className="flex h-20 items-center justify-between px-6">
          <h1 className="font-display text-xl font-bold text-primary">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{name}</span>
            <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="md:ml-64 pt-24 px-4 sm:px-8 pb-12">{children}</main>
    </div>
  );
}

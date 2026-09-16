"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { subscribeToVerificationQueue } from "@/lib/verify-badge";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const nav = [
  { href: "/admin", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/verifikasi", icon: "how_to_reg", label: "Verifikasi Akun" },
  { href: "/admin/latihan", icon: "edit_square", label: "Manajemen Latihan" },
  { href: "/admin/soal", icon: "quiz", label: "Soal" },
  { href: "/admin/progres", icon: "leaderboard", label: "Progres Siswa" },
  { href: "/admin/materi", icon: "menu_book", label: "Materi" },
  { href: "/admin/budaya", icon: "museum", label: "Budaya" },
  { href: "/admin/akun", icon: "manage_accounts", label: "Kelola Akun" },
];

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/verifikasi": "Verifikasi Akun",
  "/admin/latihan": "Manajemen Latihan",
  "/admin/soal": "Soal",
  "/admin/progres": "Progres Siswa",
  "/admin/materi": "Materi",
  "/admin/budaya": "Budaya",
  "/admin/akun": "Kelola Akun",
};

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const name = profile?.full_name || "Admin";
  const title =
    titles[pathname] ||
    (pathname.startsWith("/admin/soal") ? "Soal" : "Admin");

  // Navigasi mobile: sebelumnya TIDAK ADA (sidebar hidden md:flex, logout ikut
  // tersembunyi) — admin tidak bisa pindah halaman/logout di ponsel.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => {
    setMobileNavOpen(false); // tutup drawer setiap pindah halaman
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  // Badge pengajuan pending: SATU kali fetch + realtime updates. Dulu:
  // RPC list_verification_queue dipanggil ulang setiap pindah halaman.
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    const { refresh, cleanup } = subscribeToVerificationQueue((count) =>
      setPendingCount(count)
    );
    void refresh();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-[60] w-64 hidden md:flex flex-col border-r border-outline-variant bg-white">
        <div className="flex min-h-full flex-col p-8">
          <div className="mb-6">
            <span className="block font-display text-2xl font-extrabold text-primary">
              KANUM
            </span>
            <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase bg-secondary-container text-white px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            {nav.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
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
                  {item.href === "/admin/verifikasi" && pendingCount > 0 && (
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
        <div className="flex h-16 md:h-20 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {/* Hamburger mobile — pintu masuk satu-satunya navigasi + logout */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Buka menu navigasi"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high md:hidden"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
            <h1 className="min-w-0 truncate font-display text-lg font-bold text-primary sm:text-xl">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden text-sm font-semibold sm:inline">{name}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* ── Drawer navigasi mobile ── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-outline-variant bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
              <div>
                <span className="block font-display text-2xl font-extrabold text-primary">KANUM</span>
                <span className="mt-1 inline-block rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Admin
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Tutup menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high"
              >
                <Icon name="close" className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
              {nav.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold",
                      active
                        ? "bg-primary-container text-white shadow-md"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary",
                    )}
                  >
                    <Icon name={item.icon} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/admin/verifikasi" && pendingCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold text-white">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-outline-variant p-4">
              <LogoutButton className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-error-container hover:text-error" />
            </div>
          </aside>
        </div>
      )}

      <main className="px-4 pb-12 pt-20 sm:px-8 md:ml-64 md:pt-24">{children}</main>
    </div>
  );
}

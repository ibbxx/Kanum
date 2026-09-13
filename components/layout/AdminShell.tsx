"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const nav = [
  { href: "/admin", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/latihan", icon: "edit_square", label: "Manajemen Latihan" },
  { href: "/admin/soal", icon: "quiz", label: "Soal" },
  { href: "/admin/progres", icon: "leaderboard", label: "Progres Siswa" },
  { href: "/admin/materi", icon: "menu_book", label: "Materi" },
  { href: "/admin/budaya", icon: "museum", label: "Budaya" },
];

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/latihan": "Manajemen Latihan",
  "/admin/soal": "Soal",
  "/admin/progres": "Progres Siswa",
  "/admin/materi": "Materi",
  "/admin/budaya": "Budaya",
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
                  {item.label}
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

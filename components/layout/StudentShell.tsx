"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const nav = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/materi", icon: "menu_book", label: "Materi" },
  { href: "/budaya", icon: "museum", label: "Budaya" },
  { href: "/latihan", icon: "fitness_center", label: "Latihan" },
  { href: "/laporan", icon: "analytics", label: "Laporan" },
  { href: "/pengaturan", icon: "settings", label: "Pengaturan" },
];

const mobile = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/materi", icon: "menu_book", label: "Materi" },
  { href: "/latihan", icon: "quiz", label: "Quiz" },
  { href: "/laporan", icon: "analytics", label: "Laporan" },
  { href: "/pengaturan", icon: "menu", label: "Menu" },
];

export function StudentShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const name = profile?.full_name || "Siswa";
  const klass = profile?.class_name || "Kelas";

  return (
    <div className="min-h-screen bg-background">
      <aside className="h-screen w-64 fixed left-0 top-0 hidden md:flex flex-col bg-white border-r border-outline-variant z-50">
        <div className="flex flex-col h-full py-8 px-6">
          <div className="mb-10">
            <span className="font-headline-md text-headline-md text-primary font-bold">
              KANUM
            </span>
            <p className="font-label-md text-label-md text-on-surface-variant">
              Matematika & Budaya
            </p>
          </div>
          <nav className="flex-1 space-y-2">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-label-md transition-colors",
                    active
                      ? "text-primary font-bold border-r-4 border-primary bg-surface-container-high"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
                  )}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-6 border-t border-outline-variant">
            <LogoutButton className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-error w-full text-left font-label-md text-label-md" />
          </div>
        </div>
      </aside>

      <main className="md:ml-64 min-h-screen flex flex-col pb-24 md:pb-8">
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-outline-variant">
          <div className="flex justify-between items-center w-full px-4 sm:px-gutter py-3 max-w-container-max mx-auto">
            <p className="font-headline-sm text-primary md:hidden">KANUM</p>
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="font-label-md text-label-md text-on-surface font-bold">
                  {name}
                </p>
                <p className="font-label-md text-[10px] text-on-surface-variant">
                  {klass}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 px-4 sm:px-gutter py-stack-lg max-w-container-max mx-auto w-full">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 bg-surface shadow-lg md:hidden z-50 rounded-t-xl">
        {mobile.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-1 rounded-xl",
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant"
              )}
            >
              <Icon name={item.icon} />
              <span className="font-label-md text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { brand } from "@/lib/design/tokens";
import { staffRoleLabel, type AdminConsole } from "@/lib/admin/roles";
import { consoleTitle } from "@/lib/admin/navigation";
import type { AdminNavBadges, NavGroup } from "@/lib/admin/navigation";
import { STAFF_LOGIN_PATH } from "@/lib/admin-paths";
import type { UserRole } from "@/types/database";
import { AdminSidebar } from "./admin-sidebar";
import {
  AdminCommandPalette,
  AdminCommandTrigger,
} from "./admin-command-palette";
import { StaffBottomNav } from "./staff-bottom-nav";

type Props = {
  console: AdminConsole;
  groups: NavGroup[];
  badges?: AdminNavBadges;
  role: UserRole;
  displayName: string;
  lastLoginAt?: string | null;
  children: React.ReactNode;
};

export function AdminShell({
  console: consoleType,
  groups,
  badges,
  role,
  displayName,
  lastLoginAt,
  children,
}: Props) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(STAFF_LOGIN_PATH);
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] bg-surface">
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:shrink-0">
        <AdminSidebar groups={groups} badges={badges} />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 shadow-2xl">
            <AdminSidebar
              groups={groups}
              badges={badges}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <AdminCommandPalette
        groups={groups}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-navy/10 bg-navy text-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Image src={brand.logoSm} alt="" width={32} height={32} className="rounded-lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gold">
                  {consoleTitle(consoleType)}
                </p>
                <p className="truncate text-xs text-white/50">{displayName}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <AdminCommandTrigger onClick={() => setPaletteOpen(true)} />
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 sm:hidden"
                aria-label="Search admin tools"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </button>
              <span className="hidden rounded-full bg-gold/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold sm:inline">
                {staffRoleLabel(role)}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
          {lastLoginAt && (
            <p className="border-t border-white/5 px-4 py-1.5 text-[10px] text-white/40 lg:px-6">
              Last login: {new Date(lastLoginAt).toLocaleString("en-NG")}
            </p>
          )}
        </header>

        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">{children}</main>
      </div>

      <StaffBottomNav role={role} console={consoleType} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminPath, SUPPORT_BASE_PATH, TECH_BASE_PATH } from "@/lib/admin-paths";
import { isSuperAdmin, type AdminConsole } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

function buildStaffNav(role: UserRole, consoleType: AdminConsole): NavItem[] {
  if (isSuperAdmin(role)) {
    return [
      {
        href: adminPath("overview"),
        label: "Dashboard",
        match: (p) => p.includes("/overview") || p.endsWith("/auth"),
      },
      {
        href: adminPath("listings/review"),
        label: "Review",
        match: (p) => p.includes("/listings/review") || p.includes("/trust-review"),
      },
      {
        href: adminPath("trust-review-queue"),
        label: "Trust",
        match: (p) => p.includes("/trust") && !p.includes("/trust-review-queue"),
      },
      {
        href: adminPath("users"),
        label: "People",
        match: (p) =>
          p.includes("/users") ||
          p.includes("/agents") ||
          p.includes("/staff"),
      },
      {
        href: adminPath("settings"),
        label: "System",
        match: (p) =>
          p.includes("/settings") ||
          p.includes("/audit-logs") ||
          p.includes("/health"),
      },
    ];
  }

  if (consoleType === "support") {
    return [
      {
        href: SUPPORT_BASE_PATH,
        label: "Tasks",
        match: (p) => p === SUPPORT_BASE_PATH,
      },
      {
        href: `${SUPPORT_BASE_PATH}/moderation`,
        label: "Review",
        match: (p) => p.includes("/moderation") || p.includes("/reports"),
      },
      {
        href: `${SUPPORT_BASE_PATH}/leads`,
        label: "Support",
        match: (p) => p.includes("/leads") || p.includes("/requests"),
      },
      {
        href: `${SUPPORT_BASE_PATH}/inspections`,
        label: "Alerts",
        match: (p) => p.includes("/inspections"),
      },
      {
        href: `${SUPPORT_BASE_PATH}/accounts`,
        label: "Account",
        match: (p) => p.includes("/accounts") || p.includes("/quick-replies"),
      },
    ];
  }

  if (consoleType === "tech") {
    return [
      { href: TECH_BASE_PATH, label: "Health", match: (p) => p === TECH_BASE_PATH },
      {
        href: `${TECH_BASE_PATH}/errors`,
        label: "Errors",
        match: (p) => p.includes("/errors"),
      },
      {
        href: `${TECH_BASE_PATH}/webhooks`,
        label: "Webhooks",
        match: (p) => p.includes("/webhooks"),
      },
      {
        href: `${TECH_BASE_PATH}/otp`,
        label: "OTP",
        match: (p) => p.includes("/otp") || p.includes("/email"),
      },
      {
        href: `${TECH_BASE_PATH}/env`,
        label: "System",
        match: (p) => p.includes("/env") || p.includes("/uploads"),
      },
    ];
  }

  return [
    {
      href: adminPath("overview"),
      label: "Tasks",
      match: (p) => p.includes("/overview") || p.includes("/operations"),
    },
    {
      href: adminPath("listings/review"),
      label: "Review",
      match: (p) => p.includes("/listings/review") || p.includes("/listings"),
    },
    {
      href: adminPath("trust-review-queue"),
      label: "Trust",
      match: (p) => p.includes("/trust-review") || p.includes("/reports"),
    },
    {
      href: adminPath("notifications"),
      label: "Alerts",
      match: (p) => p.includes("/notifications"),
    },
    {
      href: adminPath("settings"),
      label: "Account",
      match: (p) => p.includes("/settings"),
    },
  ];
}

type Props = {
  role: UserRole;
  console: AdminConsole;
};

export function StaffBottomNav({ role, console: consoleType }: Props) {
  const pathname = usePathname();
  const items = buildStaffNav(role, consoleType);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-md lg:hidden"
      aria-label="Staff navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors",
                  active
                    ? "bg-gold/15 text-navy"
                    : "text-muted-foreground hover:bg-surface-muted hover:text-navy"
                )}
              >
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

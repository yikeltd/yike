"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DeveloperSubnav({ className }: { className?: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/developers", label: "Overview" },
    { href: "/developers/sdks", label: "SDKs" },
    { href: "/developers/events", label: "Event Catalog" },
    { href: "/developers/playground", label: "Playground" },
    { href: "/developers/sandbox", label: "Sandbox" },
    { href: "/developers/api", label: "API Versions" },
    { href: "/developers/changelog", label: "Changelog" },
    { href: "/developers/migrations", label: "Migration Guides" },
  ];

  return (
    <nav className={cn("flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/10 rounded-2xl text-xs font-bold overflow-x-auto select-none", className)}>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3.5 py-1.5 rounded-xl shrink-0 transition-all",
              isActive
                ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy font-black shadow-sm"
                : "text-navy/70 dark:text-white/70 hover:bg-white dark:hover:bg-white/10"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

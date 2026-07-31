"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DeveloperSubnav({ className }: { className?: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/developers", label: "Overview" },
    { href: "/developers/observability", label: "Observability" },
    { href: "/developers/cache", label: "Cache & Edge" },
    { href: "/developers/jobs", label: "Background Jobs" },
    { href: "/developers/semantic-search", label: "AI Search" },
    { href: "/developers/recommendations", label: "AI Recommendations" },
    { href: "/developers/risk-intelligence", label: "Risk Intelligence" },
    { href: "/developers/ha-dr", label: "HA & Disaster Recovery" },
    { href: "/developers/sdks", label: "SDKs" },
    { href: "/developers/scopes", label: "OAuth Scopes" },
    { href: "/developers/events", label: "Event Catalog" },
    { href: "/developers/health", label: "API Health" },
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

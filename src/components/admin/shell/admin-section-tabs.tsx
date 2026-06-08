"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SectionTab } from "@/lib/admin/navigation";

export function AdminSectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Section"
      className="hide-scrollbar -mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-navy/10 pb-px"
    >
      {tabs.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.href.length > 12 && pathname.startsWith(tab.href + "/"));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 rounded-t-lg px-3 py-2.5 text-xs font-bold transition-colors",
              active
                ? "border-b-2 border-gold bg-gold/10 text-navy"
                : "text-muted hover:bg-surface hover:text-navy"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

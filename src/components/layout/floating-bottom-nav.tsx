"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/post-property", label: "List", icon: PlusCircle },
  { href: "/agent", label: "Profile", icon: User },
];

export function FloatingBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/auth") || pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label="Main"
    >
      <div className="pointer-events-auto glass shadow-float-lg flex w-full max-w-md items-center justify-around rounded-full px-1 py-1.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "pressable flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
                active ? "text-navy" : "text-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                  active &&
                    "bg-gold text-navy shadow-glow-gold scale-105"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={cn(active && "text-navy")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

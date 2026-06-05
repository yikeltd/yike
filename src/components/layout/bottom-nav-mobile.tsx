"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Search, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Swipe", icon: Layers },
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/agent", label: "Profile", icon: User },
];

export function BottomNavMobile() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname === "/browse" ||
    pathname.startsWith("/browse/")
  ) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Main"
    >
      <div className="flex w-full max-w-lg items-center justify-around rounded-2xl border border-surface bg-elevated/95 py-1 shadow-float-lg backdrop-blur-lg">
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
                "pressable flex min-w-[52px] flex-col items-center gap-0.5 py-1.5 text-[9px] font-bold uppercase tracking-wide",
                active ? "text-foreground" : "text-muted"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  active && "bg-gold text-navy"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

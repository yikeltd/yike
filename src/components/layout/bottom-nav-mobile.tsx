"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Layers, Search, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

const items = [
  { href: "/", label: "Home", icon: Home, auth: false },
  { href: "/browse", label: "Swipe", icon: Layers, auth: false },
  { href: "/?focus=search", label: "Search", icon: Search, auth: false },
  { href: "/saved", label: "Saved", icon: Heart, auth: true, intent: "saved" as const },
  { href: "/agent", label: "Profile", icon: User, auth: true, intent: "profile" as const },
];

function isNavActive(
  href: string,
  pathname: string,
  focusSearch: boolean
): boolean {
  if (href === "/?focus=search") {
    return pathname === "/" && focusSearch;
  }
  if (href === "/") {
    return pathname === "/" && !focusSearch;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNavMobile() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const focusSearch = searchParams.get("focus") === "search";
  const { guardAction } = useAuth();

  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/lex") ||
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
        {items.map(({ href, label, icon: Icon, auth, intent }) => {
          const active = isNavActive(href, pathname, focusSearch);

          if (auth && intent) {
            return (
              <button
                key={href}
                type="button"
                onClick={() =>
                  guardAction(
                    { type: intent, redirectPath: href },
                    () => {
                      window.location.href = href;
                    }
                  )
                }
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
              </button>
            );
          }

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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Search, Heart, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Swipe", icon: Layers },
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Heart },
] as const;

function isNavActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Canonical mobile bottom nav — Home · Swipe · Search · Saved · Profile/Sign In */
export function PrimaryBottomNav() {
  const pathname = usePathname();
  const { user, loading, guardAction, openAuth } = useAuth();

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
      <div className="flex w-full max-w-lg items-center justify-around rounded-full border border-navy/12 bg-[#f4f6fa]/96 px-1 py-1.5 shadow-[0_4px_24px_rgb(2_20_51_/22%),0_1px_0_rgb(255_255_255_/85%)] backdrop-blur-xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "pressable flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
                active ? "text-navy" : "text-navy/50"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                  active
                    ? "bg-gold text-navy shadow-glow-gold scale-105"
                    : "bg-navy/[0.06] text-navy/60"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2.25} />
              </span>
              {label}
            </Link>
          );
        })}
        {user ? (
          <button
            type="button"
            onClick={() =>
              guardAction({ type: "profile", redirectPath: "/agent" }, () => {
                window.location.href = "/agent";
              })
            }
            className={cn(
              "pressable flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
              isNavActive("/agent", pathname) ? "text-navy" : "text-navy/50"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                isNavActive("/agent", pathname)
                  ? "bg-gold text-navy shadow-glow-gold scale-105"
                  : "bg-navy/[0.06] text-navy/60"
              )}
            >
              <User className="h-[18px] w-[18px]" strokeWidth={isNavActive("/agent", pathname) ? 2.5 : 2} />
            </span>
            Profile
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => openAuth({ type: "profile", redirectPath: "/agent" })}
            className={cn(
              "pressable flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
              pathname.startsWith("/auth") ? "text-navy" : "text-navy/50"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                pathname.startsWith("/auth")
                  ? "bg-gold text-navy shadow-glow-gold scale-105"
                  : "bg-navy/[0.06] text-navy/60"
              )}
            >
              <LogIn className="h-[18px] w-[18px]" strokeWidth={pathname.startsWith("/auth") ? 2.5 : 2} />
            </span>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Search, Heart, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/browse", label: "Swipe", icon: Layers },
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Heart },
] as const;

function isNavActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNavMobile() {
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
      <div className="flex w-full max-w-lg items-center justify-around rounded-2xl border border-surface bg-elevated/95 py-1 shadow-float-lg backdrop-blur-lg">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
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
        {user ? (
          <button
            type="button"
            onClick={() =>
              guardAction({ type: "profile", redirectPath: "/agent" }, () => {
                window.location.href = "/agent";
              })
            }
            className={cn(
              "pressable flex min-w-[52px] flex-col items-center gap-0.5 py-1.5 text-[9px] font-bold uppercase tracking-wide",
              isNavActive("/agent", pathname) ? "text-foreground" : "text-muted"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                isNavActive("/agent", pathname) && "bg-gold text-navy"
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
              "pressable flex min-w-[52px] flex-col items-center gap-0.5 py-1.5 text-[9px] font-bold uppercase tracking-wide",
              pathname.startsWith("/auth") ? "text-foreground" : "text-muted"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                pathname.startsWith("/auth") && "bg-gold text-navy"
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

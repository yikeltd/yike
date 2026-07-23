"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, PlusCircle, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { ListPropertyNavLink } from "@/components/auth/list-property-button";

/**
 * Canonical mobile bottom nav — Home · Search · Saved · Sell · Account
 * Search is the marketplace hub (active on /search and /vehicles).
 * Swipe removed — inventory-first browse lives on Home.
 */
const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, match: "exact" as const },
  {
    href: "/search",
    label: "Search",
    icon: Search,
    match: "marketplace" as const,
  },
  { href: "/saved", label: "Saved", icon: Heart, match: "prefix" as const },
] as const;

function isNavActive(
  href: string,
  pathname: string,
  match: "exact" | "prefix" | "marketplace",
): boolean {
  if (match === "exact") return pathname === href;
  if (match === "marketplace") {
    return (
      pathname === "/search" ||
      pathname.startsWith("/search/") ||
      pathname === "/vehicles" ||
      pathname.startsWith("/vehicles/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

  const sellActive =
    pathname === "/post-property" || pathname.startsWith("/post-property/");
  const accountActive = isNavActive("/agent", pathname, "prefix");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Main"
    >
      <div className="flex w-full max-w-lg items-center justify-around rounded-full border border-navy/12 bg-[#f4f6fa]/96 px-1 py-1.5 shadow-[0_4px_24px_rgb(2_20_51_/22%),0_1px_0_rgb(255_255_255_/85%)] backdrop-blur-xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = isNavActive(href, pathname, match);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "pressable flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
                active ? "text-navy" : "text-navy/50",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                  active
                    ? "bg-gold text-navy shadow-glow-gold scale-105"
                    : "bg-navy/[0.06] text-navy/60",
                )}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={active ? 2.5 : 2.25}
                />
              </span>
              {label}
            </Link>
          );
        })}

        <ListPropertyNavLink
          href="/post-property"
          className={cn(
            "pressable flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
            sellActive ? "text-navy" : "text-navy/50",
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
              sellActive
                ? "bg-gold text-navy shadow-glow-gold scale-105"
                : "bg-navy/[0.06] text-navy/60",
            )}
          >
            <PlusCircle
              className="h-[18px] w-[18px]"
              strokeWidth={sellActive ? 2.5 : 2.25}
            />
          </span>
          Sell
        </ListPropertyNavLink>

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
              accountActive ? "text-navy" : "text-navy/50",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                accountActive
                  ? "bg-gold text-navy shadow-glow-gold scale-105"
                  : "bg-navy/[0.06] text-navy/60",
              )}
            >
              <User
                className="h-[18px] w-[18px]"
                strokeWidth={accountActive ? 2.5 : 2}
              />
            </span>
            Account
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => openAuth({ type: "profile", redirectPath: "/agent" })}
            className={cn(
              "pressable flex min-w-[52px] flex-col items-center gap-0.5 rounded-full px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
              pathname.startsWith("/auth") ? "text-navy" : "text-navy/50",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                pathname.startsWith("/auth")
                  ? "bg-gold text-navy shadow-glow-gold scale-105"
                  : "bg-navy/[0.06] text-navy/60",
              )}
            >
              <LogIn
                className="h-[18px] w-[18px]"
                strokeWidth={pathname.startsWith("/auth") ? 2.5 : 2}
              />
            </span>
            Account
          </button>
        )}
      </div>
    </nav>
  );
}

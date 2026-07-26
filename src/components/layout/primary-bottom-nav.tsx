"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Heart,
  PlusCircle,
  User,
  LogIn,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { ListPropertyNavLink } from "@/components/auth/list-property-button";

/**
 * Canonical mobile bottom nav — Home · Saved · Discover · Sell · Account
 * Discover is the elevated center signature discovery action.
 * Search lives on homepage + Discover header + listing pages.
 */

function isNavActive(
  href: string,
  pathname: string,
  match: "exact" | "prefix",
): boolean {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
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
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2.25} />
      </span>
      {label}
    </Link>
  );
}

export function PrimaryBottomNav() {
  const pathname = usePathname();
  const { user, loading, guardAction, openAuth } = useAuth();

  if (pathname.startsWith("/auth") || pathname.startsWith("/lex")) {
    return null;
  }

  const homeActive = isNavActive("/", pathname, "exact");
  const savedActive = isNavActive("/saved", pathname, "prefix");
  const discoverActive =
    pathname === "/discover" ||
    pathname.startsWith("/discover/") ||
    pathname === "/browse" ||
    pathname.startsWith("/browse/") ||
    pathname === "/swipe";
  const sellActive =
    pathname === "/post-property" || pathname.startsWith("/post-property/");
  const accountActive = isNavActive("/agent", pathname, "prefix");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      aria-label="Main"
    >
      <div className="relative flex w-full max-w-lg items-end justify-around rounded-full border border-navy/12 bg-[#f4f6fa]/96 px-1 py-1.5 shadow-[0_4px_24px_rgb(2_20_51_/22%),0_1px_0_rgb(255_255_255_/85%)] backdrop-blur-xl">
        <NavTab href="/" label="Home" icon={Home} active={homeActive} />
        <NavTab href="/saved" label="Saved" icon={Heart} active={savedActive} />

        {/* Elevated center Discover FAB */}
        <div className="relative flex min-w-[64px] flex-col items-center justify-end">
          <Link
            href="/discover"
            aria-label="Discover listings"
            aria-current={discoverActive ? "page" : undefined}
            className={cn(
              "pressable group relative -mt-6 mb-0.5 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-[0_10px_28px_-6px_rgba(228,181,71,0.65),0_4px_12px_rgba(2,20,51,0.2)] ring-4 ring-[#f4f6fa]/96 transition-transform duration-200 active:scale-95",
              discoverActive && "scale-105 shadow-glow-gold ring-gold/30",
            )}
          >
            <Sparkles
              className="h-6 w-6 transition-transform duration-200 group-active:scale-90"
              strokeWidth={2.4}
              aria-hidden
            />
          </Link>
          <span
            className={cn(
              "pb-0.5 text-[9px] font-bold uppercase tracking-wide",
              discoverActive ? "text-navy" : "text-navy/50",
            )}
          >
            Discover
          </span>
        </div>

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

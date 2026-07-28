"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { ListPropertyNavLink } from "@/components/auth/list-property-button";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  PlusCircle,
  User,
  LogIn,
  Sparkles,
  Bookmark,
} from "lucide-react";

/**
 * Yike Navigation Standard — Full-Width Deep Navy Bar (LOCKED)
 * - Navigation 1: Public (Unauthenticated) — Home · Saved · Discover (Gold FAB) · Sell · Account
 * - Navigation 2: Authenticated — Home · Discover · Sell (Gold FAB) · Messages (badge 5) · Profile
 * Full-width edge-to-edge dark navy background matching mockup input_file_0.png
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
      prefetch={true}
      className={cn(
        "pressable flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-all duration-200",
        active ? "text-gold" : "text-white/60 hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
          active
            ? "bg-gold text-navy shadow-[0_0_12px_rgba(228,181,71,0.5)] scale-105"
            : "bg-white/5 text-white/70"
        )}
      >
        <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.5 : 2} />
      </span>
      {label}
    </Link>
  );
}

export function PrimaryBottomNav() {
  const pathname = usePathname();
  const { user, loading, openAuth } = useAuth();

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
  const messagesActive = isNavActive("/conversations", pathname, "prefix");
  const profileActive = isNavActive("/agent", pathname, "prefix") || pathname === "/profile";

  // ==========================================
  // NAVIGATION 2 — AUTHENTICATED (FULL-WIDTH DEEP NAVY)
  // Home · Discover · Sell (Gold FAB) · Messages 5 · Profile
  // ==========================================
  if (user) {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-[#031B4E] border-t border-white/10 shadow-[0_-8px_32px_rgba(2,20,51,0.4)] lg:hidden pb-[max(0.25rem,env(safe-area-inset-bottom))]"
        aria-label="Authenticated Navigation"
      >
        <div className="flex w-full max-w-lg items-center justify-around px-2 py-1">
          <NavTab href="/" label="Home" icon={Home} active={homeActive} />
          
          <NavTab href="/discover" label="Discover" icon={Sparkles} active={discoverActive} />

          {/* Elevated Center Gold Sell FAB */}
          <div className="relative flex flex-col items-center justify-center">
            <Link
              href="/post-property"
              aria-label="Post Property"
              className={cn(
                "pressable relative -mt-5 flex h-13 w-13 items-center justify-center rounded-full bg-gold text-navy shadow-[0_6px_20px_rgba(228,181,71,0.6)] border-2 border-[#031B4E] transition-transform active:scale-95",
                sellActive && "scale-105 ring-4 ring-gold/40"
              )}
            >
              <PlusCircle className="h-7 w-7 text-navy fill-navy/10" strokeWidth={2.5} />
            </Link>
            <span className={cn("text-[9px] font-bold uppercase tracking-wide mt-0.5", sellActive ? "text-gold" : "text-white/60")}>
              Sell
            </span>
          </div>

          {/* Messages Tab with Badge 5 */}
          <Link
            href="/conversations"
            prefetch
            className={cn(
              "pressable relative flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
              messagesActive ? "text-gold" : "text-white/60 hover:text-white"
            )}
          >
            <span
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                messagesActive ? "bg-gold text-navy shadow-[0_0_12px_rgba(228,181,71,0.5)] scale-105" : "bg-white/5 text-white/70"
              )}
            >
              <MessageSquare className="h-4.5 w-4.5" strokeWidth={messagesActive ? 2.5 : 2} />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-black text-navy shadow-xs border border-[#031B4E]">
                5
              </span>
            </span>
            Messages
          </Link>

          <Link
            href="/agent"
            prefetch
            className={cn(
              "pressable flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
              profileActive ? "text-gold" : "text-white/60 hover:text-white"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                profileActive ? "bg-gold text-navy shadow-[0_0_12px_rgba(228,181,71,0.5)] scale-105" : "bg-white/5 text-white/70"
              )}
            >
              <User className="h-4.5 w-4.5" strokeWidth={profileActive ? 2.5 : 2} />
            </span>
            Profile
          </Link>
        </div>
      </nav>
    );
  }

  // ==========================================
  // NAVIGATION 1 — PUBLIC / UNAUTHENTICATED (FULL-WIDTH DEEP NAVY)
  // Home · Saved · Discover (Gold FAB) · Sell · Account
  // ==========================================
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center bg-[#031B4E] border-t border-white/10 shadow-[0_-8px_32px_rgba(2,20,51,0.4)] lg:hidden pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      aria-label="Public Navigation"
    >
      <div className="flex w-full max-w-lg items-center justify-around px-2 py-1">
        <NavTab href="/" label="Home" icon={Home} active={homeActive} />
        
        {/* Saved Tab */}
        <NavTab href="/saved" label="Saved" icon={Bookmark} active={savedActive} />

        {/* Elevated Center Gold Discover FAB */}
        <div className="relative flex flex-col items-center justify-center">
          <Link
            href="/discover"
            aria-label="Discover listings"
            aria-current={discoverActive ? "page" : undefined}
            className={cn(
              "pressable group relative -mt-5 flex h-13 w-13 items-center justify-center rounded-full bg-gold text-navy shadow-[0_6px_20px_rgba(228,181,71,0.6)] border-2 border-[#031B4E] transition-transform duration-200 active:scale-95",
              discoverActive && "scale-105 shadow-glow-gold"
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
              "mt-0.5 text-[9px] font-bold uppercase tracking-wide",
              discoverActive ? "text-gold" : "text-white/60"
            )}
          >
            Discover
          </span>
        </div>

        <ListPropertyNavLink
          href="/post-property"
          className={cn(
            "pressable flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
            sellActive ? "text-gold" : "text-white/60 hover:text-white"
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
              sellActive ? "bg-gold text-navy shadow-[0_0_12px_rgba(228,181,71,0.5)] scale-105" : "bg-white/5 text-white/70"
            )}
          >
            <PlusCircle className="h-4.5 w-4.5" strokeWidth={sellActive ? 2.5 : 2} />
          </span>
          Sell
        </ListPropertyNavLink>

        <button
          type="button"
          disabled={loading}
          onClick={() => openAuth({ type: "profile", redirectPath: "/agent" })}
          className={cn(
            "pressable flex min-w-[56px] flex-col items-center gap-0.5 px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors duration-200",
            pathname.startsWith("/auth") ? "text-gold" : "text-white/60 hover:text-white"
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
              pathname.startsWith("/auth") ? "bg-gold text-navy shadow-[0_0_12px_rgba(228,181,71,0.5)] scale-105" : "bg-white/5 text-white/70"
            )}
          >
            <LogIn className="h-4.5 w-4.5" strokeWidth={pathname.startsWith("/auth") ? 2.5 : 2} />
          </span>
          Account
        </button>
      </div>
    </nav>
  );
}

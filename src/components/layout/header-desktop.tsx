"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-provider";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/**
 * Unified Desktop Header — Deep Yike Navy background (#031B4E).
 * Order: [Yike Logo] -> [Search Bar] -> [Location Selector] -> [SELL] -> [SIGN IN / PROFILE]
 */
export function HeaderDesktop({ className }: { className?: string }) {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 hidden w-full bg-[#031B4E] text-white shadow-xl lg:block border-b border-white/10",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 xl:px-8">
        {/* 1. YIKE LOGO */}
        <Link href="/" className="flex shrink-0 items-center" aria-label="Yike home">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />
        </Link>

        {/* 2. SEARCH BAR */}
        <div className="flex-1 max-w-2xl">
          <Suspense fallback={<div className="h-10 w-full rounded-full bg-white/10" />}>
            <HeaderUniversalSearch
              size="large"
              tone="hero"
              placement="header_desktop"
              placeholder="Search vehicles & properties…"
            />
          </Suspense>
        </div>

        {/* 3. FUNCTIONAL LOCATION SELECTOR */}
        <div className="shrink-0">
          <MarketplaceLocationIndicator size="md" variant="chip" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20" />
        </div>

        {/* 4. ACTION BUTTONS */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* SELL BUTTON */}
          <Link
            href={isAuthenticated ? "/agent/listings/choose" : "/auth/login?next=/agent/listings/choose"}
            className="pressable flex items-center justify-center rounded-full bg-gold px-4 py-2 text-xs font-black uppercase text-navy shadow-sm transition-all hover:bg-gold-light"
          >
            SELL
          </Link>

          {/* SIGN IN OR PROFILE BUTTON */}
          {isAuthenticated ? (
            <Link
              href="/agent"
              className="pressable flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/20"
            >
              PROFILE
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="pressable flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-bold text-navy shadow-sm transition-all hover:bg-slate-100"
            >
              SIGN IN
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

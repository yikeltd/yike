"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { MarketplaceNavSheet } from "@/components/marketplace/experience";

/**
 * Desktop marketplace chrome — Logo | Search (dominant) | Menu.
 * Nav / Sell / Account live in MarketplaceNavSheet (unchanged open behavior).
 */
export function HeaderDesktop({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 hidden border-b border-surface/70 bg-white/95 backdrop-blur-md lg:block",
        className,
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-4 px-6 xl:gap-5 xl:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Yike home">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            {brand.name}
          </span>
        </Link>

        <Suspense
          fallback={
            <div className="h-12 min-w-0 flex-1 rounded-full bg-navy/[0.04]" />
          }
        >
          <HeaderUniversalSearch
            size="large"
            tone="desktop"
            placement="header_desktop"
            showLocation
            showMic
          />
        </Suspense>

        <MarketplaceNavSheet size="md" className="shrink-0" />
      </div>
    </header>
  );
}

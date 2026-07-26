"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { MobileHeaderBanner } from "@/components/banners/mobile-header-banner";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";
import { MarketplaceNavSheet } from "@/components/marketplace/experience";
import type { SiteBanner } from "@/types/database";

/**
 * Mobile chrome — Logo | Search (max width) | Location.
 * Sell lives in bottom nav only.
 */
export function HeaderMobile({
  mobileBanner,
}: {
  mobileBanner?: SiteBanner | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isProfile = pathname === "/agent";
  const isBrowse = pathname === "/browse" || pathname.startsWith("/browse/");
  const isDetail =
    pathname.startsWith("/properties/") ||
    (pathname.startsWith("/vehicles/") && pathname.split("/").length >= 3);

  if (isDetail || isProfile) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-surface bg-elevated/95 backdrop-blur-md lg:hidden",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3",
          isHome ? "min-h-14 py-2" : "min-h-12 py-2",
          isBrowse && "border-b-0",
        )}
      >
        <Link href="/" className="shrink-0" aria-label="Yike home">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={isHome ? 34 : 32}
            height={isHome ? 34 : 32}
            className="rounded-lg"
            priority
          />
        </Link>
        <Suspense
          fallback={
            <div
              className={cn(
                "min-w-0 flex-1 rounded-full bg-navy/[0.06]",
                isHome ? "h-11" : "h-9",
              )}
            />
          }
        >
          <HeaderUniversalSearch
            size={isHome ? "large" : "default"}
            tone="default"
            placement="header_mobile"
          />
        </Suspense>
        <Suspense fallback={<div className="h-8 w-16 shrink-0" />}>
          <MarketplaceLocationIndicator size={isHome ? "sm" : "sm"} />
        </Suspense>
        <MarketplaceNavSheet size={isHome ? "md" : "sm"} />
      </div>
      {mobileBanner && <MobileHeaderBanner banner={mobileBanner} />}
    </header>
  );
}

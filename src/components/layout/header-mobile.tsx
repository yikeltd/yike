"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MobileHeaderBanner } from "@/components/banners/mobile-header-banner";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { MarketplaceCategoryChips } from "@/components/home/marketplace-category-chips";
import type { SiteBanner } from "@/types/database";

/**
 * Mobile chrome — search pill with logo inside + location.
 * On home: premium category banners under search; banners auto-hide on scroll.
 * Hamburger removed — bottom nav covers Sell / Account / Browse.
 * Desktop header is unchanged.
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

  const [bannersVisible, setBannersVisible] = useState(true);

  useEffect(() => {
    if (!isHome) return;

    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (y <= 16) {
        setBannersVisible(true);
      } else if (y > 40) {
        setBannersVisible(false);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  if (isDetail || isProfile) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-surface/70 bg-elevated/95 backdrop-blur-md lg:hidden",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center px-4",
          isHome ? "min-h-14 py-2.5" : "min-h-12 py-2",
          isBrowse && "border-b-0",
        )}
      >
        <Suspense
          fallback={
            <div
              className={cn(
                "w-full rounded-full bg-navy/[0.06]",
                isHome ? "h-11" : "h-10",
              )}
            />
          }
        >
          <HeaderUniversalSearch
            size={isHome ? "large" : "default"}
            tone="default"
            placement="header_mobile"
            placeholder="Search vehicles & properties…"
            showLocation
            showLogo
            className="w-full"
          />
        </Suspense>
      </div>

      {isHome ? (
        <div
          className={cn(
            "overflow-hidden px-4 transition-[max-height,opacity,transform] duration-200 ease-out",
            bannersVisible
              ? "max-h-[110px] translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-2 opacity-0",
          )}
          aria-hidden={!bannersVisible}
        >
          <div className="pb-3 pt-0.5">
            <Suspense fallback={<div className="h-20 rounded-2xl bg-navy/[0.04]" />}>
              <MarketplaceCategoryChips homeMode />
            </Suspense>
          </div>
        </div>
      ) : null}

      {mobileBanner && <MobileHeaderBanner banner={mobileBanner} />}
    </header>
  );
}

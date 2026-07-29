"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";
import type { SiteBanner } from "@/types/database";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/**
 * Mobile Header — Deep Yike Navy background (#031B4E).
 * Layout: [Yike Logo] -> [Search Bar] -> [Location Selector]
 */
export function HeaderMobile({
  mobileBanner,
}: {
  mobileBanner?: SiteBanner | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isProfile = pathname === "/agent";
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
        "sticky top-0 z-40 border-b border-white/10 bg-[#031B4E] text-white shadow-xl lg:hidden",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        {/* 1. YIKE LOGO */}
        <Link href="/" className="flex shrink-0 items-center gap-1.5" aria-label="Yike home">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={30}
            height={30}
            className="h-7.5 w-7.5 object-contain"
          />
          <span className="text-xl font-black tracking-tight text-white">
            {brand.name}
          </span>
        </Link>

        {/* 2. SEARCH BAR */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<div className="h-9 w-full rounded-full bg-white/10" />}>
            <HeaderUniversalSearch
              size="default"
              tone="hero"
              placement="header_mobile"
              placeholder="Search vehicles & properties…"
            />
          </Suspense>
        </div>

        {/* 3. FUNCTIONAL LOCATION SELECTOR */}
        <div className="shrink-0">
          <MarketplaceLocationIndicator
            size="sm"
            variant="chip"
            className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20"
          />
        </div>
      </div>
    </header>
  );
}

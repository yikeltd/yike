"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";
import type { SiteBanner } from "@/types/database";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/**
 * Mobile Header — Deep Yike Navy background (#031B4E).
 * Order: [Yike Logo] -> [Search Bar] -> [Location Selector] -> [SELL] -> [PROFILE / SIGN IN]
 */
export function HeaderMobile({
  mobileBanner,
}: {
  mobileBanner?: SiteBanner | null;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

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
      <div className="flex flex-col gap-2 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
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

          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <HeaderUniversalSearch
              size="default"
              tone="hero"
              placement="header_mobile"
              placeholder="Search vehicles & properties…"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href={isAuthenticated ? "/agent/listings/choose" : "/auth/login?next=/agent/listings/choose"}
              className="pressable flex items-center justify-center rounded-full bg-gold px-2.5 py-1 text-[10px] font-black uppercase text-navy shadow-xs"
            >
              SELL
            </Link>

            {isAuthenticated ? (
              <Link
                href="/agent"
                className="pressable flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white"
              >
                PROFILE
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="pressable flex items-center justify-center rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-navy shadow-xs"
              >
                SIGN IN
              </Link>
            )}
          </div>
        </div>

        {/* Location Selector Row */}
        <div className="flex items-center justify-between px-0.5 pt-0.5">
          <MarketplaceLocationIndicator size="sm" variant="chip" className="!bg-white/10 !border-white/20 !text-white" />
        </div>
      </div>
    </header>
  );
}

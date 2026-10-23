"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { MarketplaceLocationIndicator } from "@/components/location/marketplace-location-indicator";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/**
 * Mobile Header — Deep Yike Navy background (#031B4E).
 * Layout: [Yike Logo] -> [Search Bar] -> [Location Selector]
 */
export function HeaderMobile() {
  const pathname = usePathname();
  const isProfile = pathname === "/agent";
  const isDetail =
    pathname.startsWith("/properties/") ||
    (pathname.startsWith("/vehicles/") && pathname.split("/").length >= 3) ||
    (pathname.startsWith("/electronics/") && pathname.split("/").length >= 3);

  if (isDetail || isProfile) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-white/10 bg-[#031B4E] text-white shadow-xl lg:hidden",
        "pt-[max(0.25rem,env(safe-area-inset-top))]",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 pb-2.5">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Yike home">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={30}
            height={30}
            className="h-7.5 w-7.5 object-contain"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="h-9 w-full rounded-full bg-white/10" />}>
            <HeaderUniversalSearch
              size="default"
              tone="hero"
              placement="header_mobile"
              placeholder="Search property, vehicles & electronics…"
            />
          </Suspense>
        </div>

        <div className="shrink-0">
          <MarketplaceLocationIndicator
            size="sm"
            variant="chip"
            className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
          />
        </div>
      </div>
    </header>
  );
}

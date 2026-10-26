"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { useHomeLargeSearchBarVisible } from "@/lib/home/home-marketplace-filter-context";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

/** Mobile top search — scrolls with page (not sticky). Unified logo + input + location in one bar. */
export function HeaderMobile() {
  const pathname = usePathname();
  const isProfile = pathname === "/agent";
  const isDetail =
    pathname.startsWith("/properties/") ||
    (pathname.startsWith("/vehicles/") && pathname.split("/").length >= 3) ||
    (pathname.startsWith("/electronics/") && pathname.split("/").length >= 3);
  const showLargeSearch = useHomeLargeSearchBarVisible();

  if (isDetail || isProfile) return null;

  return (
    <div
      className={cn(
        "lg:hidden border-b border-white/10 bg-[#031B4E] text-white shadow-md",
        "px-2.5 pb-2 pt-[max(0.35rem,env(safe-area-inset-top))] sm:px-3",
      )}
    >
      <Suspense fallback={<div className="h-10 w-full rounded-full bg-white/10" />}>
        {showLargeSearch ? (
          <div data-testid="home-unified-search-bar">
            <HeaderUniversalSearch
              layout="unified"
              size="default"
              tone="hero"
              placement="header_mobile"
              placeholder="Search property, vehicles & electronics…"
            />
          </div>
        ) : (
          <div
            data-testid="home-unified-search-collapsed"
            className="flex h-10 min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2"
          >
            <Link
              href="/"
              className="shrink-0 rounded-lg p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              aria-label="Yike home"
            >
              <Image
                src={brand.logoSm}
                alt={brand.logoAlt}
                width={28}
                height={28}
                className="h-7 w-7 rounded-md"
                priority
              />
            </Link>
            <span className="truncate text-xs font-medium text-white/55">
              Select filters below to search
            </span>
          </div>
        )}
      </Suspense>
    </div>
  );
}

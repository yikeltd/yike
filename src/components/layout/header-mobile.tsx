"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { MobileHeaderBanner } from "@/components/banners/mobile-header-banner";
import { HeaderMobileSearch } from "@/components/search/header-mobile-search";
import type { SiteBanner } from "@/types/database";

/** Mobile chrome — logo + compact intelligent search. */
export function HeaderMobile({
  mobileBanner,
}: {
  mobileBanner?: SiteBanner | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isBrowse = pathname === "/browse" || pathname.startsWith("/browse/");
  const isSearch = pathname === "/search" || pathname.startsWith("/search/");
  const showHeaderSearch = !isHome && !isBrowse && !isSearch;

  return (
    <header className="sticky top-0 z-40 border-b border-surface bg-elevated/95 backdrop-blur-md lg:hidden">
      <div
        className={cn(
          "flex items-center px-3 py-2",
          isHome ? "justify-start" : "gap-2.5"
        )}
      >
        <Link href="/" className="shrink-0">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
        </Link>
        {showHeaderSearch || isSearch ? <HeaderMobileSearch /> : null}
      </div>
      {mobileBanner && <MobileHeaderBanner banner={mobileBanner} />}
    </header>
  );
}

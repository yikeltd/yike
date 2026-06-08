"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
import { MobileHeaderBanner } from "@/components/banners/mobile-header-banner";
import { HeaderMobileSearch } from "@/components/search/header-mobile-search";
import type { SiteBanner } from "@/types/database";

/** Mobile chrome — logo + compact search on one row. */
export function HeaderMobile({
  mobileBanner,
}: {
  mobileBanner?: SiteBanner | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isProfile = pathname === "/agent";
  const isBrowse = pathname === "/browse" || pathname.startsWith("/browse/");
  const isDetail = pathname.startsWith("/properties/");

  if (isDetail || isProfile) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 lg:hidden",
        isHome
          ? "border-b border-white/[0.08] bg-[#021433]/98 shadow-[0_4px_24px_rgba(2,20,51,0.35)]"
          : "border-b border-surface bg-elevated/95 backdrop-blur-md"
      )}
    >
      <div
        className={cn(
          "flex min-h-12 items-center gap-2 px-3 py-2",
          isBrowse && "border-b-0"
        )}
      >
        <Link href="/" className="shrink-0" aria-label="Yike home">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
        </Link>
        <HeaderMobileSearch variant={isHome ? "hero" : "default"} />
      </div>
      {mobileBanner && <MobileHeaderBanner banner={mobileBanner} />}
    </header>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/design/tokens";
import { MobileHeaderBanner } from "@/components/banners/mobile-header-banner";
import type { SiteBanner } from "@/types/database";

/** Minimal mobile chrome — search lives in HomeSearchHero on home. */
export function HeaderMobile({
  mobileBanner,
}: {
  mobileBanner?: SiteBanner | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-surface bg-elevated/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center px-3 py-2.5">
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
      </div>
      {mobileBanner && <MobileHeaderBanner banner={mobileBanner} />}
    </header>
  );
}

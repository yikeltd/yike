"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HeaderDesktop } from "./header-desktop";
import { HeaderMobile } from "./header-mobile";
import { BottomNavMobile } from "./bottom-nav-mobile";
import { DesktopWhatsappAdminButton } from "./desktop-whatsapp-admin-button";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { OfflineWarmCache } from "@/components/pwa/offline-warm-cache";
import type { SiteBanner } from "@/types/database";
import { HomeMarketplaceFilterProvider } from "@/lib/home/home-marketplace-filter-context";

export function ConsumerShell({
  children,
  mobileBanner: _mobileBanner,
  showDesktopWhatsappFab = true,
}: {
  children: React.ReactNode;
  mobileBanner?: SiteBanner | null;
  /** Yike support WhatsApp — public home/browse only; off in agent/seller portal chrome. */
  showDesktopWhatsappFab?: boolean;
}) {
  void _mobileBanner;
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isProfile = pathname === "/agent";
  const isPropertyDetail = pathname.startsWith("/properties/");
  const isVehicleDetail =
    pathname.startsWith("/vehicles/") && pathname.split("/").length >= 3;
  const isListingDetail = isPropertyDetail || isVehicleDetail;
  const isDiscover =
    pathname === "/discover" || pathname.startsWith("/discover/");
  const hideChrome =
    pathname.startsWith("/auth") || pathname.startsWith("/lex");

  if (hideChrome) {
    return (
      <HomeMarketplaceFilterProvider>
        <OfflineBanner />
        <OfflineWarmCache />
        <main className="flex-1">{children}</main>
      </HomeMarketplaceFilterProvider>
    );
  }

  /* Discover: immersive deck — desktop site header + mobile bottom nav */
  if (isDiscover) {
    return (
      <HomeMarketplaceFilterProvider>
        <OfflineBanner />
        <OfflineWarmCache />
        <div className="hidden lg:block">
          <HeaderDesktop />
        </div>
        <main className="flex-1">{children}</main>
        <Suspense fallback={null}>
          <BottomNavMobile />
        </Suspense>
      </HomeMarketplaceFilterProvider>
    );
  }

  return (
    <HomeMarketplaceFilterProvider>
      <OfflineBanner />
      <OfflineWarmCache />
      {!isHome && !isProfile && <HeaderDesktop />}
      <HeaderMobile />
      <main
        className={cn(
          "mx-auto w-full flex-1",
          !isHome &&
            !isListingDetail &&
            !isProfile &&
            "px-3 lg:max-w-7xl lg:px-6 xl:px-8",
          isListingDetail && "lg:max-w-7xl lg:px-6 xl:px-8",
          isProfile && "w-full",
          isListingDetail ? "safe-bottom-detail" : "safe-bottom",
          "lg:safe-bottom-0 lg:pb-6"
        )}
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNavMobile />
      </Suspense>
      {showDesktopWhatsappFab ? <DesktopWhatsappAdminButton /> : null}
    </HomeMarketplaceFilterProvider>
  );
}


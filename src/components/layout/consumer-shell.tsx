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

export function ConsumerShell({
  children,
  mobileBanner,
}: {
  children: React.ReactNode;
  mobileBanner?: SiteBanner | null;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isProfile = pathname === "/agent";
  const isPropertyDetail = pathname.startsWith("/properties/");
  const isBrowse = pathname === "/browse" || pathname.startsWith("/browse/");
  const hideChrome =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/lex") ||
    isBrowse;

  if (hideChrome) {
    return (
      <>
        <OfflineBanner />
        <OfflineWarmCache />
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <>
      <OfflineBanner />
      <OfflineWarmCache />
      <HeaderDesktop />
      <HeaderMobile mobileBanner={mobileBanner} />
      <main
        className={cn(
          "mx-auto w-full flex-1",
          !isHome &&
            !isPropertyDetail &&
            "px-3 lg:max-w-7xl lg:px-6 xl:px-8",
          isPropertyDetail && "lg:max-w-7xl lg:px-6 xl:px-8",
          isProfile && "pt-[max(0.75rem,env(safe-area-inset-top))]",
          isPropertyDetail ? "safe-bottom-detail" : "safe-bottom",
          "lg:safe-bottom-0 lg:pb-6"
        )}
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNavMobile />
      </Suspense>
      <DesktopWhatsappAdminButton />
    </>
  );
}

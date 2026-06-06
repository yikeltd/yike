"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HeaderDesktop } from "./header-desktop";
import { HeaderMobile } from "./header-mobile";
import { BottomNavMobile } from "./bottom-nav-mobile";
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
  const isDetail = pathname.startsWith("/properties/");
  const isBrowse = pathname === "/browse" || pathname.startsWith("/browse/");
  const hideChrome =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/lex") ||
    isBrowse;

  if (hideChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <HeaderDesktop />
      <HeaderMobile mobileBanner={mobileBanner} />
      <main
        className={cn(
          "mx-auto w-full flex-1",
          !isHome && "px-3 lg:max-w-7xl lg:px-6 xl:px-8",
          isDetail
            ? "safe-bottom-detail lg:safe-bottom-detail lg:pb-12"
            : "safe-bottom lg:pb-16",
          "lg:safe-bottom-0"
        )}
      >
        {children}
      </main>
      <Suspense fallback={null}>
        <BottomNavMobile />
      </Suspense>
    </>
  );
}

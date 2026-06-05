"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HeaderDesktop } from "./header-desktop";
import { HeaderMobile } from "./header-mobile";
import { BottomNavMobile } from "./bottom-nav-mobile";

export function ConsumerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDetail = pathname.startsWith("/properties/");
  const isBrowse = pathname === "/browse" || pathname.startsWith("/browse/");
  const hideChrome =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    isBrowse;

  if (hideChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <HeaderDesktop />
      <HeaderMobile />
      <main
        className={cn(
          "mx-auto w-full flex-1",
          "lg:max-w-7xl lg:px-6 xl:px-8",
          isDetail
            ? "safe-bottom-detail lg:safe-bottom-detail lg:pb-12"
            : "safe-bottom lg:pb-16",
          "lg:safe-bottom-0"
        )}
      >
        {children}
      </main>
      <BottomNavMobile />
    </>
  );
}

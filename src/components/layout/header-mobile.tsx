"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { HeaderUniversalSearch } from "@/components/search/header-universal-search";
import { cn } from "@/lib/utils";

/** Mobile top search — scrolls with page (not sticky). Unified logo + input + location in one bar. */
export function HeaderMobile() {
  const pathname = usePathname();
  const isProfile = pathname === "/agent";
  const isDetail =
    pathname.startsWith("/properties/") ||
    (pathname.startsWith("/vehicles/") && pathname.split("/").length >= 3) ||
    (pathname.startsWith("/electronics/") && pathname.split("/").length >= 3);

  if (isDetail || isProfile) return null;

  return (
    <div
      className={cn(
        "lg:hidden border-b border-white/10 bg-[#031B4E] text-white shadow-md",
        "px-2.5 pb-2 pt-[max(0.35rem,env(safe-area-inset-top))] sm:px-3",
      )}
    >
      <Suspense fallback={<div className="h-10 w-full rounded-full bg-white/10" />}>
        <HeaderUniversalSearch
          layout="unified"
          size="default"
          tone="hero"
          placement="header_mobile"
          placeholder="Search property, vehicles & electronics…"
        />
      </Suspense>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ensureMarketplaceLocationPersisted } from "@/lib/marketplace-location";

/**
 * Homepage location bootstrap — silent only.
 * Re-hydrates cookies from localStorage on return visits.
 * Never shows an interruptive Allow / Not Now prompt (Jiji-style: opt-in via header picker / Near Me).
 */
export function MarketplaceLocationBootstrap() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const hydrated = ensureMarketplaceLocationPersisted();
    if (hydrated.location && hydrated.cookiesWereStale) {
      router.refresh();
    }
  }, [pathname, router]);

  return null;
}

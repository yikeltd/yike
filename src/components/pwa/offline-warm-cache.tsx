"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cachePageForOffline } from "@/lib/pwa/cache";
import { markWarmSession } from "@/lib/pwa/offline-ui";
import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * After a successful online visit, warm the SW document cache so hard
 * refresh / reopen offline serves the last homepage — not /offline.
 */
export function OfflineWarmCache() {
  const pathname = usePathname();
  const online = useOnlineStatus();

  useEffect(() => {
    if (!online) return;
    markWarmSession();

    // Prefer clean homepage key for offline reopen
    if (pathname === "/") {
      cachePageForOffline("/");
      return;
    }

    if (
      pathname.startsWith("/properties/") ||
      pathname.startsWith("/vehicles/") ||
      pathname === "/search" ||
      pathname === "/buy" ||
      pathname === "/rent" ||
      pathname === "/land" ||
      pathname === "/vehicles" ||
      pathname === "/saved"
    ) {
      cachePageForOffline(pathname);
    }
  }, [pathname, online]);

  return null;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MarketplaceLocationPrompt } from "@/components/location/marketplace-location-prompt";
import {
  ensureMarketplaceLocationPersisted,
  hasSeenLocationPrompt,
  type MarketplaceLocation,
} from "@/lib/marketplace-location";

/**
 * First-visit location prompt on homepage only.
 * Return visits: re-hydrate cookies from localStorage — never re-prompt if saved
 * or dismissed. No permanent location form on the homepage.
 */
export function MarketplaceLocationBootstrap() {
  const router = useRouter();
  const pathname = usePathname();
  const [promptOpen, setPromptOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    let cancelled = false;

    // Harden return visits: saved city stays until the user changes it
    const hydrated = ensureMarketplaceLocationPersisted();
    if (hydrated.location) {
      if (hydrated.cookiesWereStale) {
        router.refresh();
      }
      return;
    }

    // Already dismissed / denied / nationwide — don't re-prompt
    if (hasSeenLocationPrompt()) return;

    if (!cancelled) setPromptOpen(true);

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const onAllow = useCallback(
    (_loc: MarketplaceLocation) => {
      setPromptOpen(false);
      router.refresh();
    },
    [router],
  );

  const onDismiss = useCallback(() => {
    setPromptOpen(false);
  }, []);

  if (pathname !== "/") return null;

  return (
    <MarketplaceLocationPrompt
      open={promptOpen}
      onAllow={onAllow}
      onDismiss={onDismiss}
    />
  );
}

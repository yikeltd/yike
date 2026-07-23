"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getBrowsePreferences,
  syncBrowseFromRecentSearches,
} from "@/lib/browse-preferences";
import { syncSearchPrefCookies } from "@/lib/search-pref-cookies";
import { ensureMarketplaceLocationPersisted } from "@/lib/marketplace-location";

/** Sync passive browse prefs → cookies so server feeds preload localized listings. */
export function PrefSync() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // Marketplace location is the source of truth — never overwrite with browse history
    const { location, cookiesWereStale } = ensureMarketplaceLocationPersisted();
    if (location) {
      if (cookiesWereStale) router.refresh();
      return;
    }

    syncBrowseFromRecentSearches();
    const prefs = getBrowsePreferences();
    if (prefs.cities.length === 0 && prefs.areas.length === 0) return;

    const hadCityCookie = document.cookie.includes("yike_pref_city=");
    syncSearchPrefCookies({
      city: prefs.cities[0],
      area: prefs.areas[0],
      listingType: prefs.listingTypes[0],
    });

    if (!hadCityCookie && prefs.cities[0]) {
      router.refresh();
    }
  }, [router]);

  return null;
}

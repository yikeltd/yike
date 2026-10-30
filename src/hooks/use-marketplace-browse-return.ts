"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildBrowseReturnPath,
  listingHrefWithBrowseReturn,
  type ListingSlice,
} from "@/lib/marketplace/browse-navigation";

export function useMarketplaceBrowseReturn() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const browseReturn = useMemo(
    () => buildBrowseReturnPath(pathname, searchParams),
    [pathname, searchParams]
  );

  function listingHref(listing: ListingSlice): string {
    return listingHrefWithBrowseReturn(listing, browseReturn);
  }

  return { browseReturn, listingHref };
}

import { safeNextPath } from "@/lib/auth/safe-next-path";
import { listingPath } from "@/lib/marketplace/listing-path";
import type { Property } from "@/types/database";

/** Query param carrying encoded browse context (path + filters). */
export const BROWSE_RETURN_QUERY = "browseReturn";

const SESSION_KEY = "yike_browse_return";

export type MarketplacePortal = "consumer" | "agent";

const AGENT_PORTAL_PREFIXES = ["/agent", "/seller"] as const;

const LISTING_DETAIL_PREFIXES = [
  "/properties/",
  "/vehicles/",
  "/electronics/",
] as const;

/** Infer portal from pathname only (navigation context, not authorization). */
export function inferMarketplacePortal(pathname: string): MarketplacePortal {
  const path = pathname.split("?")[0] || "/";
  for (const prefix of AGENT_PORTAL_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return "agent";
    }
  }
  return "consumer";
}

export function isPublicListingDetailPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "";
  return LISTING_DETAIL_PREFIXES.some((p) => path.startsWith(p));
}

/** Surfaces where opening a listing should preserve return context. */
export function isMarketplaceBrowseSurface(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  if (path === "/" || path === "/discover" || path.startsWith("/discover/")) {
    return true;
  }
  if (path === "/search" || path.startsWith("/search")) return true;
  if (path === "/vehicles" || path.startsWith("/vehicles")) return true;
  if (path === "/electronics" || path.startsWith("/electronics")) return true;
  if (path === "/saved" || path.startsWith("/saved")) return true;
  if (path === "/browse" || path.startsWith("/browse")) return true;
  if (path === "/agent/listings" || path.startsWith("/agent/listings")) {
    return true;
  }
  return false;
}

export function buildBrowseReturnPath(
  pathname: string,
  search?: string | URLSearchParams | null
): string | null {
  if (!isMarketplaceBrowseSurface(pathname)) return null;
  let qs = "";
  if (search instanceof URLSearchParams) {
    qs = search.toString();
  } else if (typeof search === "string") {
    qs = search.startsWith("?") ? search.slice(1) : search;
  }
  const combined = qs ? `${pathname}?${qs}` : pathname;
  const safe = safeNextPath(combined, "");
  return safe || null;
}

export function listingHrefWithBrowseReturn(
  listing: Parameters<typeof listingPath>[0],
  browseReturn: string | null | undefined
): string {
  const base = listingPath(listing);
  if (!browseReturn) return base;
  const safe = safeNextPath(browseReturn, "");
  if (!safe || isPublicListingDetailPath(safe)) return base;

  const url = new URL(base, "https://yike.ng");
  url.searchParams.set(BROWSE_RETURN_QUERY, safe);
  return `${url.pathname}${url.search}`;
}

/** Safe back target when opening a listing detail without browse context. */
export function resolveListingDetailBackFallback(pathname: string): string {
  const path = pathname.split("?")[0] || "/";
  if (path.startsWith("/electronics/")) return "/electronics";
  if (path.startsWith("/vehicles/")) return "/vehicles";
  if (path.startsWith("/properties/")) return "/search";
  if (inferMarketplacePortal(path) === "agent") return "/agent/listings";
  return "/search";
}

export function resolveBrowseBackTarget(
  browseReturnParam: string | null | undefined,
  fallback: string
): string {
  if (browseReturnParam) {
    const fromQuery = safeNextPath(browseReturnParam, "");
    if (fromQuery && !isPublicListingDetailPath(fromQuery)) {
      return fromQuery;
    }
  }
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const fromSession = safeNextPath(stored, "");
        if (fromSession && !isPublicListingDetailPath(fromSession)) {
          return fromSession;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return safeNextPath(fallback, "/search");
}

export function persistBrowseReturn(path: string | null | undefined): void {
  if (typeof window === "undefined" || !path) return;
  const safe = safeNextPath(path, "");
  if (!safe || isPublicListingDetailPath(safe)) return;
  try {
    sessionStorage.setItem(SESSION_KEY, safe);
  } catch {
    /* ignore */
  }
}

export function clearBrowseReturn(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Post-login `next` must not jump portals (except onto public listing detail). */
export function coerceLoginNextForPortal(
  signingInFromPath: string,
  requestedNext: string | null | undefined,
  fallback: string
): string {
  const safe = safeNextPath(requestedNext, fallback);
  const nextPath = safe.split("?")[0] || safe;
  if (isPublicListingDetailPath(nextPath)) return safe;

  const fromPath = signingInFromPath.split("?")[0] || signingInFromPath;
  if (
    fromPath === "/" ||
    fromPath.startsWith("/auth") ||
    !isMarketplaceBrowseSurface(fromPath)
  ) {
    return safe;
  }

  const fromPortal = inferMarketplacePortal(fromPath);
  const nextPortal = inferMarketplacePortal(nextPath);
  if (fromPortal === nextPortal) return safe;

  const fromQuery = safe.includes("?") ? safe.slice(safe.indexOf("?")) : "";
  const restored = buildBrowseReturnPath(fromPath, fromQuery || null);
  return restored ?? safeNextPath(fromPath, fallback);
}

export function scrollRetentionKey(pathname: string, search: string): string {
  const qs = search.startsWith("?") ? search.slice(1) : search;
  return qs ? `${pathname}?${qs}` : pathname;
}

export type ListingSlice = Pick<Property, "id" | "slug"> & {
  asset_type?: Property["asset_type"] | string | null;
};

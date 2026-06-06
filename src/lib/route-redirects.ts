/**
 * Static path redirects for old bookmarks, marketing links, and aliases.
 * Returns destination pathname (optionally with query) or null.
 */
export function staticPathRedirect(pathname: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === pathname && pathname.endsWith("/") && pathname !== "/") {
    // trailing slash normalization handled separately
  }

  const exact: Record<string, string> = {
    "/home": "/",
    "/swipe-homes": "/browse",
    "/swipe": "/browse",
    "/list": "/agent/become",
    "/list-property": "/agent/become",
    "/request-home": "/request-property",
    "/cookie-policy": "/cookies",
    "/legal": "/privacy",
    "/support": "/contact",
  };

  if (exact[normalized]) return exact[normalized];

  if (normalized.startsWith("/admin")) {
    const rest = normalized.slice("/admin".length);
    return rest ? `/lex${rest}` : "/lex";
  }

  // Old listing URLs: /listing/:id and /property/:id → /properties/:id
  const listingMatch = normalized.match(/^\/listing\/([^/]+)$/);
  if (listingMatch) return `/properties/${listingMatch[1]}`;

  const propertyMatch = normalized.match(/^\/property\/([^/]+)$/);
  if (propertyMatch) return `/properties/${propertyMatch[1]}`;

  return null;
}

/** Normalize trailing slashes (except root). */
export function trailingSlashRedirect(pathname: string): string | null {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return null;
}

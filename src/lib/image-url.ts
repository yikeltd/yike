/** Pick the right listing photo variant for cards, galleries, and swipe. */
export function optimizeListingImageUrl(src: string, width = 720): string {
  if (!src.startsWith("http")) return src;

  try {
    const url = new URL(src);

    if (url.hostname.includes("unsplash.com")) {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", width <= 480 ? "75" : "82");
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      url.searchParams.set("crop", "entropy");
      return url.toString();
    }

    if (url.hostname.includes("supabase.co") && url.pathname.includes("/storage/")) {
      return optimizeSupabaseStorageUrl(url, width);
    }

    return src;
  } catch {
    return src;
  }
}

function variantSuffix(width: number): "-thumb.webp" | "-md.webp" | "-lg.webp" {
  if (width <= 420) return "-thumb.webp";
  if (width <= 820) return "-md.webp";
  return "-lg.webp";
}

function optimizeSupabaseStorageUrl(url: URL, width: number): string {
  const target = variantSuffix(width);
  const path = url.pathname;

  if (/-(thumb|md|lg)\.webp$/i.test(path)) {
    url.pathname = path.replace(/-(thumb|md|lg)\.webp$/i, target);
    return url.toString();
  }

  const renderPath = path.replace("/object/public/", "/render/image/public/");
  if (renderPath !== path) {
    url.pathname = renderPath;
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", width <= 420 ? "82" : width <= 820 ? "84" : "86");
    url.searchParams.set("format", "webp");
    return url.toString();
  }

  return url.toString();
}

/** True when the URL is already a sized WebP — skip Next.js re-encoding. */
export function isPreOptimizedListingUrl(src: string): boolean {
  if (!src.startsWith("http")) return false;
  try {
    const path = new URL(src).pathname;
    return (
      /-(thumb|md|lg)\.webp$/i.test(path) ||
      path.includes("/render/image/public/")
    );
  } catch {
    return false;
  }
}

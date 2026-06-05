/** Tune remote listing photos for sharp, immersive presentation. */
export function optimizeListingImageUrl(src: string, width = 1200): string {
  if (!src.startsWith("http")) return src;

  try {
    const url = new URL(src);
    if (url.hostname.includes("unsplash.com")) {
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", "82");
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "crop");
      url.searchParams.set("crop", "entropy");
      return url.toString();
    }
    return src;
  } catch {
    return src;
  }
}

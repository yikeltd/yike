import { optimizeListingImageUrl } from "@/lib/image-url";

/** Warm image cache for smoother gallery / rail transitions. */
export function prefetchListingImages(urls: string[], width = 640) {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (!url?.startsWith("http")) continue;
    const img = new window.Image();
    img.decoding = "async";
    img.src = optimizeListingImageUrl(url, width);
  }
}

/** Photo items compatible with ListingPhotoManager / ListingEngine. */
export type ListingPhotoUploadStatus = "ready" | "uploading" | "error" | string;

export type ListingPhotoLike = {
  upload_status?: ListingPhotoUploadStatus;
  image_url?: string | null;
  webp_url?: string | null;
  thumbnail_url?: string | null;
  sort_order?: number;
};

export function isReadyListingPhoto(item: ListingPhotoLike): boolean {
  const status = item.upload_status ?? "ready";
  if (status === "uploading" || status === "error") return false;
  return Boolean(item.image_url || item.webp_url || item.thumbnail_url);
}

export function readyListingPhotoUrls(photos: ListingPhotoLike[]): string[] {
  return photos
    .filter(isReadyListingPhoto)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((p) => p.image_url || p.webp_url || p.thumbnail_url)
    .filter(Boolean) as string[];
}

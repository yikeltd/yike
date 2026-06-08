import type { PropertyMediaItem } from "@/types/database";

/** Client-side upload state layered on persisted media items. */
export type ListingPhotoItem = PropertyMediaItem & {
  local_preview?: string;
  upload_status?: "uploading" | "error" | "ready";
  upload_error?: string;
  small_warning?: boolean;
};

export function isUploadingItem(item: ListingPhotoItem): boolean {
  return item.upload_status === "uploading";
}

export function photoThumbSrc(item: ListingPhotoItem): string {
  if (item.local_preview) return item.local_preview;
  if (item.blur_data_url && item.upload_status === "uploading") {
    return item.blur_data_url;
  }
  return item.thumbnail_url || item.webp_url || item.image_url;
}

/** Remove client-only fields before persisting to Supabase. */
export function stripListingPhotoForPersist(
  item: ListingPhotoItem
): PropertyMediaItem {
  const {
    local_preview: _p,
    upload_status: _s,
    upload_error: _e,
    small_warning: _w,
    ...rest
  } = item;
  return rest;
}

export function readyPhotoItems(items: ListingPhotoItem[]): ListingPhotoItem[] {
  return items.filter(
    (i) => i.upload_status !== "uploading" && i.upload_status !== "error"
  );
}

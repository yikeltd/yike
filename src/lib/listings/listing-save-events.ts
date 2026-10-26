/** Browser events keeping AuthProvider savedListingIds in sync across flows. */

export const YIKE_GUEST_FAVORITES_MERGED = "yike:guest-favorites-merged";
export const YIKE_LISTING_SAVED_CHANGED = "yike:listing-saved-changed";

export type GuestFavoritesMergedDetail = { ids: string[] };
export type ListingSavedChangedDetail = { listingId: string; saved: boolean };

export function dispatchGuestFavoritesMerged(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  window.dispatchEvent(
    new CustomEvent<GuestFavoritesMergedDetail>(YIKE_GUEST_FAVORITES_MERGED, {
      detail: { ids },
    }),
  );
}

export function dispatchListingSavedChanged(
  listingId: string,
  saved: boolean,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ListingSavedChangedDetail>(YIKE_LISTING_SAVED_CHANGED, {
      detail: { listingId, saved },
    }),
  );
}

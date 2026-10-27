import type { ListingCategoryId } from "./types";
import { isListingCategoryCreatable } from "./category-availability";

const ORDER: ListingCategoryId[] = ["property", "vehicle", "electronics"];

export function defaultCreatableListingCategory(): ListingCategoryId {
  for (const id of ORDER) {
    if (isListingCategoryCreatable(id)) return id;
  }
  return "property";
}

export function parseListingCategoryParam(
  raw: string | null | undefined,
): ListingCategoryId | null {
  if (raw === "property" || raw === "vehicle" || raw === "electronics") {
    return isListingCategoryCreatable(raw) ? raw : null;
  }
  return null;
}

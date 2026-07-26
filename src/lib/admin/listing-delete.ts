import { isSuperAdmin } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

/** Permanent (soft) delete — chief admin only. */
export function canPermanentlyDeleteListing(role: UserRole): boolean {
  return isSuperAdmin(role);
}

export const LISTING_DELETE_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "fraud", label: "Fraud" },
  { value: "fake_listing", label: "Fake Listing" },
  { value: "illegal_content", label: "Illegal Content" },
  { value: "duplicate", label: "Duplicate" },
  { value: "copyright_violation", label: "Copyright Violation" },
  { value: "other", label: "Other" },
] as const;

export type ListingDeleteReason =
  (typeof LISTING_DELETE_REASONS)[number]["value"];

export function isListingDeleteReason(value: string): value is ListingDeleteReason {
  return LISTING_DELETE_REASONS.some((r) => r.value === value);
}

export function listingDeleteReasonLabel(reason: ListingDeleteReason): string {
  return LISTING_DELETE_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

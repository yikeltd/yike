import { safeNextPath } from "@/lib/auth/safe-next-path";
import { SELLER_CHOOSE_LISTING_PATH, SELLER_VERIFY_PATH } from "./onboarding";

/** Preserve intended listing destination through seller onboarding. */
export function buildSellerVerifyUrl(returnPath?: string | null): string {
  const next = safeNextPath(returnPath, SELLER_CHOOSE_LISTING_PATH);
  return `${SELLER_VERIFY_PATH}?next=${encodeURIComponent(next)}`;
}

export function sellerListEntryPath(
  returnPath: string = SELLER_CHOOSE_LISTING_PATH
): string {
  return buildSellerVerifyUrl(returnPath);
}

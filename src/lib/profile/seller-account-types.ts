import type { AccountType } from "@/types/database";
import type { SellerType } from "@/lib/profile-display";

/** Listing seller types admins can assign (stored lowercase in DB). */
export const LISTING_SELLER_ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
}[] = [
  { value: "individual", label: "Individual" },
  { value: "agent", label: "Agent" },
  { value: "landlord", label: "Landlord" },
  { value: "agency", label: "Company" },
  { value: "developer", label: "Developer" },
];

const LISTING_SELLER_SET = new Set<AccountType>(
  LISTING_SELLER_ACCOUNT_TYPES.map((t) => t.value)
);

export function isListingSellerAccountType(
  value: string | null | undefined
): value is AccountType {
  return Boolean(value && LISTING_SELLER_SET.has(value as AccountType));
}

export function listingSellerAccountTypeLabel(
  accountType: AccountType | null | undefined
): string {
  const match = LISTING_SELLER_ACCOUNT_TYPES.find((t) => t.value === accountType);
  return match?.label ?? accountType ?? "—";
}

export function accountTypeToSellerType(
  accountType: AccountType | null | undefined
): SellerType | null {
  if (accountType === "agency") return "company";
  if (accountType === "developer") return "developer";
  if (accountType === "landlord") return "landlord";
  if (accountType === "agent") return "agent";
  if (accountType === "individual") return "individual";
  return null;
}

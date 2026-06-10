import type { Profile, AccountType } from "@/types/database";

export type BasicListingProfileSlice = Pick<
  Profile,
  | "full_name"
  | "date_of_birth"
  | "residential_address"
  | "residential_area"
  | "residential_city"
  | "residential_state"
  | "office_address"
  | "phone"
  | "whatsapp"
  | "account_type"
  | "company_name"
  | "cac_number"
  | "cac_document_path"
>;

export function isBusinessAccount(
  accountType: AccountType | null | undefined
): boolean {
  return accountType === "agency" || accountType === "developer";
}

/** @deprecated use isBusinessAccount for business-profile flows */
export function isCompanyAccount(
  accountType: AccountType | null | undefined
): boolean {
  return isBusinessAccount(accountType);
}

export function isDeveloperAccount(
  accountType: AccountType | null | undefined
): boolean {
  return accountType === "developer";
}

export function profileStreetAddress(
  profile: Partial<BasicListingProfileSlice> | null | undefined
): string {
  return (
    profile?.residential_address?.trim() ||
    profile?.office_address?.trim() ||
    ""
  );
}

export function hasBasicListingProfile(
  profile: Partial<BasicListingProfileSlice> | null | undefined
): boolean {
  if (!profile) return false;

  if (isBusinessAccount(profile.account_type)) {
    if (!profile.company_name?.trim()) return false;
    if (!profileStreetAddress(profile)) return false;
    if (!profile.residential_city?.trim()) return false;
    if (!profile.residential_state?.trim()) return false;
    if (!profile.phone?.trim() && !profile.whatsapp?.trim()) return false;
    return true;
  }

  if (!profile.full_name?.trim()) return false;
  if (!profile.date_of_birth) return false;
  if (!profileStreetAddress(profile)) return false;
  if (!profile.residential_city?.trim()) return false;
  if (!profile.residential_state?.trim()) return false;
  return true;
}

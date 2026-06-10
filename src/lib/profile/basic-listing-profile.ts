import type { Profile } from "@/types/database";

export type BasicListingProfileSlice = Pick<
  Profile,
  | "full_name"
  | "date_of_birth"
  | "residential_address"
  | "residential_area"
  | "residential_city"
  | "residential_state"
  | "residential_postal_code"
  | "country"
  | "office_address"
  | "phone"
  | "whatsapp"
>;

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
  if (!profile?.full_name?.trim()) return false;
  if (!profile.date_of_birth) return false;
  if (!profileStreetAddress(profile)) return false;
  if (!profile.residential_city?.trim()) return false;
  if (!profile.residential_state?.trim()) return false;
  return true;
}

export const BASIC_PROFILE_SETUP_MESSAGE =
  "Complete your basic profile to list a property.";

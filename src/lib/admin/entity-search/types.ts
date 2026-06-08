export type AdminEntityType =
  | "listing"
  | "user"
  | "agent"
  | "company"
  | "staff"
  | "verifier"
  | "ambassador"
  | "legal_partner";

export type AdminEntitySearchResult = {
  id: string;
  display_name: string;
  subtitle: string;
  image_url: string | null;
  badge: string | null;
  meta: Record<string, string | number | boolean | null>;
};

export type ListingSearchFilters = {
  status?: string;
  verified?: boolean;
  city?: string;
  property_type?: string;
};

export type ProfileSearchFilters = {
  verified?: boolean;
  city?: string;
};

export type UserRole =
  | "user"
  | "agent_unverified"
  | "agent_verified"
  | "admin"
  | "super_admin"
  /** @deprecated migrated to agent_unverified / agent_verified */
  | "agent";

export type SponsoredStatus = "none" | "sponsored" | "boosted";
export type VerificationStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected"
  /** @deprecated migrated to not_started */
  | "unverified"
  /** @deprecated migrated to approved */
  | "verified";
export type ListingType = "rent" | "lease" | "sale" | "shortlet";
export type PropertyStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "rented"
  | "hidden"
  | "archived";
export type PaymentPeriod = "yearly" | "monthly" | "weekly" | "daily" | "total";

/** Nigerian rent transparency + amenities — stored as JSONB */
export interface ListingExtras {
  amenities?: string[];
  agency_fee_percent?: number;
  caution_months?: number;
  agreement_fee?: number;
  service_charge?: number;
  legal_fee?: number;
  cleaning_fee?: number;
  caution_deposit?: number;
}

/** Structured listing photo — stored in properties.media_items JSONB. */
export interface PropertyMediaItem {
  id: string;
  image_url: string;
  webp_url?: string | null;
  thumbnail_url?: string | null;
  alt_text?: string | null;
  room_label?: string | null;
  sort_order: number;
  width?: number | null;
  height?: number | null;
  blur_data_url?: string | null;
  is_cover?: boolean;
  created_at?: string;
}

export type DiscoverHub =
  | "student"
  | "affordable"
  | "shortlet"
  | "land_sale"
  | "land_lease"
  | "buy"
  | "lease";

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  whatsapp: string | null;
  avatar_url: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  agent_type: "independent" | "agency" | "landlord" | null;
  trust_score: number;
  listing_limit: number | null;
  ranking_score: number;
  verified_badge: boolean;
  is_banned: boolean;
  plan: "free" | "pro" | "agency";
  plan_expires_at: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  agent_id: string;
  title: string;
  description: string | null;
  listing_type: ListingType;
  property_type: string | null;
  bedrooms: number;
  bathrooms: number;
  toilets: number;
  price: number;
  payment_period: PaymentPeriod;
  state: string;
  city: string;
  area: string;
  address_hint: string | null;
  landmark: string | null;
  media_urls: string[];
  media_items?: PropertyMediaItem[] | null;
  video_url: string | null;
  status: PropertyStatus;
  is_featured: boolean;
  featured_until: string | null;
  is_boosted: boolean;
  boosted_until: string | null;
  boost_score: number;
  sponsored_status: SponsoredStatus;
  is_verified_listing: boolean;
  views_count: number;
  contact_clicks: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  extras?: ListingExtras | null;
  agent?: Profile | null;
}

export interface ListingReport {
  id: string;
  property_id: string;
  reporter_name: string | null;
  reporter_phone: string | null;
  reason: string;
  message: string | null;
  status: "open" | "reviewed" | "resolved";
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  property?: Property | null;
}

export interface AgentVerification {
  id: string;
  agent_id: string;
  user_id?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  full_name?: string | null;
  residential_address?: string | null;
  state?: string | null;
  city?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  email?: string | null;
  occupation?: string | null;
  nin_encrypted?: string | null;
  nin_number_encrypted?: string | null;
  nin_provider?: string | null;
  nin_verified?: boolean;
  provider_reference?: string | null;
  selfie_url: string | null;
  id_document_url?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
}

export interface AdPlacement {
  id: string;
  placement_key: string;
  label: string;
  title: string | null;
  image_url: string | null;
  link_url: string | null;
  alt_text: string;
  is_active: boolean;
  property_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteBanner {
  id: string;
  title: string | null;
  message: string;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  priority: number;
  placement: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

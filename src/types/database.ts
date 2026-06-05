export type UserRole = "user" | "agent" | "admin" | "super_admin";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
export type ListingType = "rent" | "sale" | "shortlet";
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

export type DiscoverHub = "student" | "affordable" | "shortlet";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  agent_type: "independent" | "agency" | "landlord" | null;
  trust_score: number;
  is_banned: boolean;
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
  video_url: string | null;
  status: PropertyStatus;
  is_featured: boolean;
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
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  selfie_url: string | null;
  id_document_url: string | null;
  created_at: string;
}

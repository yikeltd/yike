export type UserRole =
  | "user"
  | "agent_unverified"
  | "agent_verified"
  | "admin"
  | "super_admin"
  | "support"
  | "tech"
  | "content"
  | "careers"
  | "moderator"
  /** @deprecated migrated to agent_unverified / agent_verified */
  | "agent";

export type StaffRole =
  | "super_admin"
  | "admin"
  | "support"
  | "tech"
  | "content"
  | "careers"
  | "moderator";

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden" | "flagged";
export type ReplyStatus = "pending" | "approved" | "rejected" | "hidden";
export type AgentProfileStatus =
  | "active"
  | "suspended"
  | "deleted"
  | "reinstated"
  | "on_hold"
  | "pending_verification";

export type AccountStatus =
  | "active"
  | "on_hold"
  | "suspended"
  | "deleted"
  | "pending_verification";
export type VerificationCallStatus =
  | "not_scheduled"
  | "scheduled"
  | "completed"
  | "missed"
  | "failed";
export type ReviewPublishingMode = "manual_review" | "auto_publish";

export type StaffStatus = "active" | "disabled";

export type SponsoredStatus = "none" | "sponsored" | "boosted";
export type FeaturedTier = "basic" | "premium" | "launch" | "developer";
export type YikeVerificationLevel =
  | "basic"
  | "physical"
  | "document_review"
  | "developer_partner";
export type InspectionRequestStatus =
  | "pending"
  | "contacted"
  | "assigned"
  | "scheduled"
  | "completed"
  | "rejected"
  | "cancelled";
export type InspectionPaymentStatus =
  | "not_requested"
  | "requested"
  | "paid"
  | "waived"
  | "refunded";
export type LeadDealStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "inspection_requested"
  | "negotiation"
  | "closed_won"
  | "closed_lost"
  | "spam";
export type TransactionStage =
  | "inquiry"
  | "inspection"
  | "offer"
  | "due_diligence"
  | "agreement"
  | "payment"
  | "closed";
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
  | "flagged"
  | "rejected"
  | "rented"
  | "hidden"
  | "archived";

export type ListingPlan = "free" | "premium_30" | "premium_60" | "admin_extended";

export type CompanyVerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "needs_more_info";

export type ListingActivityStatus = "active" | "stale" | "inactive" | "archived";
export type ModerationState =
  | "auto_approved"
  | "pending_review"
  | "flagged"
  | "under_investigation"
  | "approved"
  | "rejected";
export type ListingReportStatus =
  | "open"
  | "pending"
  | "reviewed"
  | "action_taken"
  | "dismissed"
  | "resolved";

export type InquiryStatus =
  | "new"
  | "responded"
  | "resolved"
  | "ignored"
  | "spam";

export type AccountType =
  | "individual"
  | "agency"
  | "developer"
  | "landlord"
  | "city_ambassador"
  | "field_verifier"
  | "legal_partner"
  | "service_provider";

export type AmbassadorStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "paused"
  | "disabled"
  | "inactive";

export type AmbassadorCommissionStatus =
  | "pending"
  | "approved"
  | "payable"
  | "paid"
  | "reversed"
  | "fraud_review"
  | "held";

export type AmbassadorRevenueSource =
  | "featured_listing"
  | "premium_plan"
  | "listing_boost"
  | "company_verification"
  | "inspection_fee"
  | "direct_lead_package"
  | "future_premium_service";

export type ListingAvailabilityStatus =
  | "available"
  | "reserved"
  | "rented"
  | "sold"
  | "unavailable"
  | "hidden"
  | "under_review";

export type AgentAvailabilityStatus =
  | "active"
  | "offline"
  | "unavailable"
  | "suspended";

export type AgentVerificationLevel =
  | "basic"
  | "identity_verified"
  | "business_verified"
  | "yike_verified"
  | "yike_partner"
  | "premium_partner";

export type ImageQualityFlag =
  | "few_images"
  | "low_resolution_hint"
  | "duplicate_url"
  | "watermark_hint"
  | "suspicious_pattern";

export type FunnelEventType =
  | "whatsapp_button_clicked"
  | "whatsapp_opened"
  | "lead_created"
  | "handoff_shared"
  | "direct_whatsapp_used"
  | "direct_call_used"
  | "call_button_clicked";
export type PaymentPeriod = "yearly" | "monthly" | "weekly" | "daily" | "total";

export type FeeTransparencyMode =
  | "exact"
  | "percent"
  | "negotiable"
  | "landlord"
  | "not_fixed";

/** Nigerian rent transparency + amenities — stored as JSONB */
export interface ListingExtras {
  amenities?: string[];
  agency_fee_percent?: number;
  agency_fee_mode?: FeeTransparencyMode;
  caution_months?: number;
  caution_fee_mode?: FeeTransparencyMode;
  agreement_fee?: number;
  agreement_fee_mode?: FeeTransparencyMode;
  service_charge?: number;
  service_charge_mode?: FeeTransparencyMode;
  legal_fee?: number;
  legal_fee_mode?: FeeTransparencyMode;
  commission_mode?: FeeTransparencyMode;
  cleaning_fee?: number;
  cleaning_fee_mode?: FeeTransparencyMode;
  caution_deposit?: number;
  caution_deposit_mode?: FeeTransparencyMode;
  fees_flexible_note?: string;
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
  pin_hash?: string | null;
  has_pin_set?: boolean;
  last_unlocked_at?: string | null;
  session_started_at?: string | null;
  session_locked_at?: string | null;
  pin_failed_attempts?: number;
  pin_locked_until?: string | null;
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
  availability_status?: AgentAvailabilityStatus;
  availability_updated_at?: string | null;
  is_verified_agent?: boolean;
  verified_agent_at?: string | null;
  verified_agent_by?: string | null;
  verification_level?: AgentVerificationLevel | null;
  inquiry_count?: number;
  avg_response_time_minutes?: number | null;
  response_rate?: number | null;
  responsiveness_score?: number | null;
  profile_completion_score?: number | null;
  parent_company_id?: string | null;
  managed_by_company?: boolean;
  company_role?: string | null;
  successful_handoffs?: number;
  complaint_count?: number;
  spam_lead_ratio?: number | null;
  stale_listing_ratio?: number | null;
  performance_score?: number | null;
  last_activity_at?: string | null;
  routing_mode?: "yike_concierge" | "direct_whatsapp" | "hybrid";
  allow_direct_whatsapp?: boolean;
  direct_whatsapp_enabled_at?: string | null;
  direct_whatsapp_enabled_by?: string | null;
  direct_whatsapp_disabled_reason?: string | null;
  billing_mode?: "free" | "pay_per_lead" | "subscription" | "manual_invoice" | "waived";
  default_lead_price?: number | null;
  premium_lead_price?: number | null;
  lead_billing_enabled?: boolean;
  direct_routing_health_status?: "healthy" | "warning" | "disabled";
  admin_pin_hash?: string | null;
  last_login_at?: string | null;
  profile_status?: AgentProfileStatus;
  profile_status_reason?: string | null;
  account_status?: AccountStatus | null;
  listing_limit_reason?: string | null;
  listing_limit_updated_at?: string | null;
  listing_limit_updated_by?: string | null;
  verification_required?: boolean;
  adaptive_trust_level?: number;
  adaptive_trust_override?: number | null;
  verification_escalation_reason?: string | null;
  verification_escalated_at?: string | null;
  verification_escalated_by?: string | null;
  listing_rules_accepted_at?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_resolved_name?: string | null;
  bank_verified?: boolean;
  bank_verified_at?: string | null;
  verification_state?: string;
  required_verification_tasks?: string[];
  operational_suspicion_score?: number;
  abuse_review_flag?: boolean;
  abuse_review_reason?: string | null;
  last_active_at?: string | null;
  suspended_at?: string | null;
  deleted_at?: string | null;
  public_slug?: string | null;
  account_type?: AccountType;
  referred_by_ambassador_id?: string | null;
  referral_code_used?: string | null;
  attributed_at?: string | null;
  attribution_locked?: boolean;
  developer_verified?: boolean;
  agency_verified?: boolean;
  company_name?: string | null;
  company_logo_url?: string | null;
  company_cover_url?: string | null;
  company_bio?: string | null;
  company_slug?: string | null;
  office_address?: string | null;
  cac_number?: string | null;
  company_verified?: boolean;
  company_verified_at?: string | null;
  company_verified_by?: string | null;
  estate_project_name?: string | null;
  is_responsive?: boolean;
  reputation_score?: number | null;
  complaint_score?: number | null;
  public_agent_code?: string | null;
  created_at: string;
}

export interface AgentReview {
  id: string;
  reviewer_id: string;
  agent_id: string | null;
  company_id: string | null;
  listing_id: string | null;
  rating: number;
  body: string;
  status: ReviewStatus;
  moderation_reason: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  body: string;
  status: ReplyStatus;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
}

export interface ReviewStats {
  average: number;
  total: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface AgentStatusLog {
  id: string;
  agent_id: string;
  action: string;
  reason: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  department: string | null;
  responsibilities: string[];
  status: StaffStatus;
  created_by: string | null;
  created_at: string;
  disabled_at: string | null;
  last_login_at: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string;
  action: string;
  summary: string | null;
  target_type: string | null;
  target_id: string | null;
  target_user_id: string | null;
  target_user_name: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  route: string | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
  risk_level: "low" | "medium" | "high" | "critical";
  created_at: string;
}

export interface AccountViewPermission {
  profile_id: string;
  can_view_accounts: boolean;
  granted_by: string | null;
  granted_at: string;
  notes: string | null;
}

export interface SupportViewSessionRow {
  id: string;
  admin_id: string;
  target_user_id: string;
  read_only: boolean;
  route: string | null;
  started_at: string;
  ended_at: string | null;
  end_reason: string | null;
}

export interface Property {
  id: string;
  agent_id: string;
  slug: string | null;
  slug_locked: boolean;
  seo_title: string | null;
  seo_description: string | null;
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
  availability_status?: ListingAvailabilityStatus;
  availability_updated_at?: string | null;
  is_featured: boolean;
  featured_until: string | null;
  featured_tier?: FeaturedTier | null;
  featured_reason?: string | null;
  featured_by?: string | null;
  featured_created_at?: string | null;
  yike_verified?: boolean;
  yike_verified_at?: string | null;
  yike_verified_by?: string | null;
  yike_verification_level?: YikeVerificationLevel | null;
  is_premium_deal?: boolean;
  developer_partner_id?: string | null;
  expected_commission_rate?: number | null;
  closing_tracking_enabled?: boolean;
  is_boosted: boolean;
  boosted_until: string | null;
  boost_score: number;
  sponsored_status: SponsoredStatus;
  is_verified_listing: boolean;
  views_count: number;
  contact_clicks: number;
  expires_at: string;
  listing_plan?: ListingPlan;
  listing_duration_days?: number;
  published_at?: string | null;
  expired_at?: string | null;
  reactivated_at?: string | null;
  last_reactivated_by?: string | null;
  unavailable_at?: string | null;
  last_refreshed_at?: string | null;
  stale_score?: number;
  freshness_score?: number | null;
  engagement_score?: number;
  inquiry_score?: number;
  hidden_quality_score?: number | null;
  moderation_state?: ModerationState;
  boost_level?: number;
  boost_priority?: number;
  boosted_at?: string | null;
  boosted_by?: string | null;
  report_review_recommended?: boolean;
  soft_hold_recommended?: boolean;
  stale_at?: string | null;
  auto_expire_at?: string | null;
  auto_archive_at?: string | null;
  listing_activity_status?: ListingActivityStatus;
  confidence_score?: number | null;
  image_quality_score?: number | null;
  image_quality_flags?: ImageQualityFlag[];
  inspection_available?: boolean;
  inspection_requested_count?: number;
  yike_inspection_eligible?: boolean;
  hot_listing?: boolean;
  possible_duplicate?: boolean;
  duplicate_group_id?: string | null;
  duplicate_confidence_score?: number | null;
  listing_health_score?: number | null;
  listing_quality_flags?: string[];
  moderation_note?: string | null;
  price_confidence_score?: number | null;
  price_anomaly_level?: string | null;
  price_anomaly_reason?: string | null;
  price_review_status?: string;
  price_reviewed_by?: string | null;
  price_reviewed_at?: string | null;
  market_price_snapshot?: Record<string, unknown> | null;
  quality_score?: number | null;
  quality_level?: "low" | "medium" | "high" | "premium" | null;
  fraud_risk_score?: number;
  moderation_flags?: string[];
  price_change_count?: number;
  last_price_changed_at?: string | null;
  last_status_changed_at?: string | null;
  last_verified_at?: string | null;
  history_summary_updated_at?: string | null;
  had_unavailable_state?: boolean;
  reactivation_count?: number;
  internal_trust_score?: number;
  internal_risk_score?: number;
  internal_trust_status?: string;
  review_overall_score?: number | null;
  review_risk_level?: string | null;
  review_suggested_action?: string | null;
  review_queue_group?: string | null;
  review_scores?: Record<string, unknown> | null;
  review_scores_updated_at?: string | null;
  review_visibility_modifier?: number;
  review_hold_status?: string;
  outcome_score?: number | null;
  outcome_evolution_delta?: number;
  outcome_signals?: Record<string, unknown> | null;
  outcome_updated_at?: string | null;
  value_drivers_status?:
    | "none"
    | "pending_review"
    | "approved"
    | "rejected"
    | "partially_approved";
  approved_value_driver_count?: number;
  public_listing_code?: string | null;
  created_at: string;
  updated_at: string;
  extras?: ListingExtras | null;
  agent?: Profile | null;
}

export interface AgentOutcomeMemory {
  agent_id: string;
  quality_score: number;
  review_strictness_modifier: number;
  positive_signal_count: number;
  negative_signal_count: number;
  outcome_summary: Record<string, unknown>;
  last_calculated_at: string | null;
  updated_at: string;
}

export interface AreaOutcomeMemory {
  area_key: string;
  state: string;
  city: string | null;
  area: string | null;
  fraud_risk_score: number;
  trust_zone_score: number;
  pricing_realism_score: number;
  complaint_rate: number;
  engagement_rate: number;
  listing_sample_count: number;
  outcome_summary: Record<string, unknown>;
  last_calculated_at: string | null;
}

export interface ListingReviewMemory {
  id: string;
  listing_id: string;
  agent_id: string | null;
  decision_type: string;
  decision_reason: string | null;
  signals: Record<string, unknown>;
  property_type: string | null;
  listing_type: string | null;
  scores_snapshot: Record<string, unknown> | null;
  admin_id: string | null;
  created_at: string;
}

export interface ListingReviewRequest {
  id: string;
  listing_id: string;
  agent_id: string;
  request_type: string;
  message: string;
  status: "open" | "responded" | "resolved" | "dismissed";
  requested_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_action: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingReviewResponse {
  id: string;
  request_id: string;
  listing_id: string;
  agent_id: string;
  response_text: string;
  evidence_urls: string[];
  created_at: string;
}

export interface ListingValueDriver {
  id: string;
  listing_id: string;
  driver_key: string;
  label: string;
  category: string;
  status: "pending_review" | "approved" | "rejected" | "requires_evidence";
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  evidence_url: string | null;
  evidence_requested: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrustScoreRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  trust_score: number;
  risk_score: number;
  confidence_score: number;
  trust_level: string;
  event_count: number;
  score_frozen: boolean;
  manual_trust_score: number | null;
  manual_risk_score: number | null;
  manual_trust_level: string | null;
  escalated: boolean;
  admin_notes: string | null;
  last_calculated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustScoreEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  score_delta: number;
  risk_delta: number;
  confidence_delta: number;
  reason: string;
  metadata: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

export type ServiceProviderVerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "paused"
  | "suspended"
  | "fraud_review";

export interface ServiceProviderProfile {
  id: string;
  user_id: string | null;
  application_id: string | null;
  provider_reference: string;
  provider_type: string;
  business_name: string | null;
  full_name: string;
  slug: string;
  bio: string | null;
  profile_image: string | null;
  banner_image: string | null;
  city: string;
  state: string;
  service_areas: string[];
  whatsapp: string;
  phone: string | null;
  address: string | null;
  years_experience: number | null;
  verification_status: ServiceProviderVerificationStatus;
  trust_status: string;
  availability_status: string;
  average_rating: number | null;
  total_jobs: number;
  complaint_count: number;
  featured: boolean;
  payout_enabled: boolean;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  request_reference: string;
  requester_id: string | null;
  provider_id: string | null;
  service_type: string;
  city: string;
  state: string;
  area: string | null;
  area_id: string | null;
  status: string;
  requester_name: string | null;
  requester_whatsapp: string | null;
  notes: string | null;
  admin_notes: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingHistoryEvent {
  id: string;
  listing_id: string;
  event_type: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  actor_id: string | null;
  actor_role: string | null;
  source: string | null;
  public_visible: boolean;
  internal_note: string | null;
  created_at: string;
}

export interface InspectionRequest {
  id: string;
  listing_id: string;
  user_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_whatsapp: string | null;
  status: InspectionRequestStatus;
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to: string | null;
  inspection_fee_amount: number | null;
  payment_status: InspectionPaymentStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  admin_notes: string | null;
  user_note: string | null;
  scout_notes: string | null;
  created_at: string;
  updated_at: string;
  listing?: Pick<Property, "id" | "title" | "city" | "area" | "slug"> | null;
}

export interface ListingReport {
  id: string;
  property_id: string;
  reporter_user_id?: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  reason: string;
  message: string | null;
  status: ListingReportStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  label: string;
  query_path: string;
  filters: Record<string, unknown>;
  notify_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type AdminNotificationCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed"
  | "cancelled";

export interface AdminNotificationCampaign {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  target_type: string;
  target_filters: Record<string, unknown>;
  action_label: string | null;
  action_url: string | null;
  status: AdminNotificationCampaignStatus;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  delivery_channel: string;
  scheduled_at: string | null;
  timezone: string;
  selected_recipient_ids: string[];
  resolved_recipient_snapshot: Record<string, unknown> | null;
  email_sent_at: string | null;
  push_sent_at: string | null;
  created_by: string;
  sent_by: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  campaign_id: string | null;
  recipient_user_id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  action_label: string | null;
  action_url: string | null;
  delivery_channel: string;
  read_at: string | null;
  delivered_at: string | null;
  email_sent_at: string | null;
  push_sent_at: string | null;
  created_at: string;
}

export interface ListingAnalyticsEvent {
  id: string;
  listing_id: string;
  event_type: string;
  user_id: string | null;
  session_id: string | null;
  city: string | null;
  state: string | null;
  metadata: Record<string, unknown>;
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
  verification_call_status?: VerificationCallStatus;
  verification_call_method?: "whatsapp";
  verification_whatsapp_number?: string | null;
  verification_call_time?: string | null;
  verification_notes?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
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
  subtitle: string | null;
  message: string;
  cta_text: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  priority: number;
  placement: string;
  campaign_type: string;
  audience_targeting: Record<string, unknown>;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

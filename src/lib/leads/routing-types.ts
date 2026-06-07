export type LeadRoutingMode = "yike_concierge" | "direct_whatsapp" | "hybrid";

export type LeadRouteTarget = "yike_support" | "direct_agent";

export type AgentBillingMode =
  | "free"
  | "pay_per_lead"
  | "subscription"
  | "manual_invoice"
  | "waived";

export type LeadChargeStatus =
  | "not_chargeable"
  | "pending"
  | "charged"
  | "waived"
  | "failed"
  | "refunded"
  | "duplicate_no_charge"
  | "insufficient_balance";

export type DirectRoutingHealth = "healthy" | "warning" | "disabled";

export type LeadRoutingDecision = {
  route_to: LeadRouteTarget;
  reason: string;
  charge_required: boolean;
  charge_amount: number;
  charge_status: LeadChargeStatus;
  handoff_url: string | null;
  routing_mode_used: LeadRoutingMode;
};

export type AgentRoutingProfile = {
  id: string;
  routing_mode: LeadRoutingMode;
  allow_direct_whatsapp: boolean;
  availability_status?: string | null;
  profile_status?: string | null;
  is_banned?: boolean | null;
  whatsapp?: string | null;
  phone?: string | null;
  billing_mode: AgentBillingMode;
  default_lead_price?: number | null;
  premium_lead_price?: number | null;
  lead_billing_enabled: boolean;
  direct_routing_health_status: DirectRoutingHealth;
  complaint_count?: number;
};

export type ListingRoutingContext = {
  id: string;
  slug?: string | null;
  title: string;
  availability_status?: string | null;
  status?: string | null;
  lead_price_override?: number | null;
  premium_lead?: boolean;
  requires_manual_review?: boolean;
};

export type VisitorContext = {
  userId?: string | null;
  guestId?: string | null;
  ipHash?: string | null;
  requesterWhatsapp?: string | null;
};

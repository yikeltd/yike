export type CallRoutingMode = "whatsapp_only" | "direct_calls" | "hybrid";

export type CallRouteType = "direct_call" | "whatsapp_fallback";

export type CallInquiryType = "whatsapp" | "direct_call" | "concierge_call";

export type CallChargeStatus =
  | "not_chargeable"
  | "pending"
  | "charged"
  | "waived"
  | "failed";

export type CallRoutingDecision = {
  allow_direct_call: boolean;
  reason: string;
  phone_number: string | null;
  route_type: CallRouteType;
  inquiry_type: CallInquiryType;
  call_routing_mode_snapshot: CallRoutingMode;
};

export type AgentCallProfile = {
  id: string;
  allow_direct_calls: boolean;
  call_routing_mode: CallRoutingMode;
  phone?: string | null;
  whatsapp?: string | null;
  profile_status?: string | null;
  is_banned?: boolean | null;
  availability_status?: string | null;
  direct_routing_health_status?: string | null;
  default_call_lead_price?: number | null;
};

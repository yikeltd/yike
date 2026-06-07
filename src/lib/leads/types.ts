import type { LeadOperationsFields, LeadQualityLabel } from "./operations-types";

export type LeadType = "whatsapp" | "call";

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

export type Lead = {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  listing_id: string;
  agent_id: string;
  lead_type: LeadType;
  source_page: string | null;
  message: string | null;
  yike_reference: string;
  status: string;
  lead_source?: string;
  inquiry_channel?: string | null;
  lead_status?: LeadDealStatus;
  transaction_stage?: TransactionStage | null;
  estimated_budget?: number | null;
  potential_deal_value?: number | null;
  developer_partner_id?: string | null;
  internal_notes?: string | null;
  clicked_at: string;
  created_at: string;
} & Partial<LeadOperationsFields>;

export type { LeadQualityLabel };

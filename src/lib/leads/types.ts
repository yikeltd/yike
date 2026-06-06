export type LeadType = "whatsapp" | "call";

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
  clicked_at: string;
  created_at: string;
};

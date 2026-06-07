export type ConciergeLeadStatus =
  | "intent_created"
  | "user_messaged_yike"
  | "handoff_prepared"
  | "handoff_shared"
  | "agent_contacted"
  | "qualified"
  | "closed_won"
  | "closed_lost"
  | "spam"
  | "cancelled";

export type ConciergeLeadSnapshot = {
  leadCode: string;
  publicListingCode: string;
  publicAgentCode: string;
  listingSlug: string | null;
  listingUrl: string;
  listingTitle: string;
  agentName: string;
  agentWhatsapp: string | null;
  handoffUrl: string;
  handoffMessage: string;
  supportReply: string;
};

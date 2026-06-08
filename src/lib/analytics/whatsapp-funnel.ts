export type FunnelEventType =
  | "whatsapp_button_clicked"
  | "whatsapp_opened"
  | "lead_created"
  | "handoff_shared"
  | "direct_whatsapp_used"
  | "direct_call_used"
  | "call_button_clicked";

export type FunnelEventInput = {
  eventType: FunnelEventType;
  listingId?: string | null;
  agentId?: string | null;
  leadId?: string | null;
  userId?: string | null;
  guestId?: string | null;
  sourcePage?: string | null;
  sourceSurface?: string | null;
  metadata?: Record<string, unknown>;
};

const FUNNEL_EVENT_TYPES: FunnelEventType[] = [
  "whatsapp_button_clicked",
  "whatsapp_opened",
  "lead_created",
  "handoff_shared",
  "direct_whatsapp_used",
  "direct_call_used",
  "call_button_clicked",
];

export function isFunnelEventType(value: string): value is FunnelEventType {
  return FUNNEL_EVENT_TYPES.includes(value as FunnelEventType);
}

/** Fire-and-forget browser funnel logging — server route handles privileged writes. */
export function logFunnelEvent(input: FunnelEventInput): void {
  if (typeof window === "undefined") return;

  void fetch("/api/analytics/funnel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {});
}

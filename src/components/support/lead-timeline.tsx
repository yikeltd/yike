type TimelineEvent = {
  id: string;
  type: string;
  actor_id: string | null;
  actor_role: string | null;
  created_at: string;
};

const LABELS: Record<string, string> = {
  lead_created: "Lead created",
  user_opened_whatsapp: "Opened WhatsApp",
  support_replied: "Support replied",
  handoff_shared: "Handoff shared",
  agent_contacted: "Agent contacted",
  inspection_requested: "Inspection requested",
  archived: "Archived",
  quality_updated: "Quality updated",
  assigned: "Assigned",
  note_added: "Note added",
  routing_decided: "Routing decided",
  call_clicked: "Call tapped",
  call_allowed: "Direct call allowed",
  call_blocked: "Call routed to WhatsApp",
  call_opened: "Dialer opened",
  copy_support_reply: "Support reply copied",
  copy_handoff_link: "Handoff link copied",
  mark_handoff_shared: "Handoff marked shared",
  user_messaged_yike: "User messaged Yike",
  mark_spam: "Marked spam",
  cancel: "Lead cancelled",
  add_note: "Note added",
  charge_recorded: "Charge recorded",
  dispute_open: "Dispute opened",
  dispute_review: "Dispute under review",
  dispute_approve_refund: "Refund approved",
  dispute_reject: "Dispute rejected",
  dispute_resolve: "Dispute resolved",
};

export function LeadTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">No timeline events yet.</p>;
  }

  return (
    <ol className="space-y-3 border-l-2 border-navy/10 pl-4">
      {events.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
          <p className="text-sm font-semibold text-navy">
            {LABELS[event.type] ?? event.type}
          </p>
          <p className="text-xs text-muted">
            {new Date(event.created_at).toLocaleString("en-NG")}
            {event.actor_role ? ` · ${event.actor_role}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

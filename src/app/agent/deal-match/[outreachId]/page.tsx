import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dealResponseWhatsAppUrl } from "@/lib/deal-matching/whatsapp";
import { publicBudgetLabel } from "@/lib/deal-matching/budget-display";
import { DEAL_REQUEST_TYPE_LABELS } from "@/lib/deal-matching/constants";
import type { DealMatchRequest } from "@/types/deal-matching";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ outreachId: string }> };

export default async function AgentDealMatchRespondPage({ params }: Props) {
  const { outreachId } = await params;
  const { user } = await requireAgent();

  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: outreach } = await admin
    .from("deal_match_outreach")
    .select("*, deal_match_requests(*)")
    .eq("id", outreachId)
    .maybeSingle();

  if (!outreach || outreach.recipient_user_id !== user.id) notFound();

  const request = outreach.deal_match_requests as DealMatchRequest | null;
  if (!request) notFound();

  const waUrl = dealResponseWhatsAppUrl(request);

  if (outreach.status === "sent") {
    await admin
      .from("deal_match_outreach")
      .update({ status: "responded", responded_at: new Date().toISOString() })
      .eq("id", outreachId);
  }

  const location = [request.target_area, request.city, request.state].filter(Boolean).join(", ");
  const budget = publicBudgetLabel(request.budget_min, request.budget_max);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">Yike deal desk</p>
      <h1 className="mt-2 text-2xl font-bold text-navy">{request.subject}</h1>
      <p className="mt-1 text-sm text-muted">
        {DEAL_REQUEST_TYPE_LABELS[request.request_type]} request
        {location ? ` · ${location}` : ""}
      </p>

      <div className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]">
        {request.property_type ? (
          <p className="text-sm">
            <span className="font-semibold text-navy">Type:</span> {request.property_type}
          </p>
        ) : null}
        {budget ? (
          <p className="text-sm">
            <span className="font-semibold text-navy">Budget:</span> {budget}
          </p>
        ) : null}
        {request.requirements ? (
          <p className="text-sm leading-relaxed text-muted">{request.requirements}</p>
        ) : null}
        <p className="text-xs text-muted">
          Client details are coordinated by Yike Operations. Do not share buyer contact details
          outside this channel.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-3 text-center text-sm font-bold text-navy"
        >
          Respond on WhatsApp
        </a>
        <Link
          href="/agent/notifications"
          className="inline-flex w-full items-center justify-center rounded-xl bg-surface px-4 py-3 text-center text-sm font-semibold text-foreground"
        >
          Back to notifications
        </Link>
      </div>
    </div>
  );
}

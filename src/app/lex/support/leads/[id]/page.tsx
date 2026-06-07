import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSupportConsole } from "@/lib/auth";
import { supportOwnsAssignment } from "@/lib/admin/support-permissions";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { supportPath } from "@/lib/admin-paths";
import { getSupportLeadDetail } from "@/lib/leads/support-queries";
import { SupportLeadActions } from "@/components/support/support-lead-actions";
import { LeadTimeline } from "@/components/support/lead-timeline";
import { QuickRepliesPanel } from "@/components/support/quick-replies-panel";
import { LeadDisputePanel } from "@/components/support/lead-dispute-panel";
import { ConciergeLeadPanel } from "@/components/support/concierge-lead-panel";
import type { HandoffPayload } from "@/lib/leads/handoff";
import { listingPublicUrl } from "@/lib/leads/whatsapp-urls";

export default async function SupportLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, user } = await requireSupportConsole();
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const lead = await getSupportLeadDetail(admin, id);
  if (!lead) notFound();
  if (
    !supportOwnsAssignment(
      profile.role,
      lead.assigned_support_id,
      user.id
    )
  ) {
    notFound();
  }

  const listing = lead.listing as {
    title: string;
    area: string;
    city: string;
    slug?: string;
    public_listing_code?: string | null;
    price?: number;
    payment_period?: HandoffPayload["paymentPeriod"];
    listing_type?: HandoffPayload["listingType"];
    bedrooms?: number | null;
    property_type?: string | null;
  } | null;

  const agent = lead.agent as {
    id: string;
    full_name?: string | null;
    whatsapp?: string | null;
    phone?: string | null;
    public_agent_code?: string | null;
  } | null;

  const handoff: HandoffPayload | null = listing
    ? {
        yikeReference: lead.yike_reference,
        leadId: lead.id,
        listingId: lead.listing_id,
        agentId: lead.agent_id,
        agentName: lead.agent_name ?? agent?.full_name ?? "Agent",
        agentWhatsapp: lead.agent_whatsapp ?? agent?.whatsapp ?? null,
        agentPhone: agent?.phone ?? null,
        title: lead.listing_title ?? listing.title,
        area: listing.area,
        city: listing.city,
        price: Number(listing.price ?? 0),
        paymentPeriod: listing.payment_period ?? "yearly",
        listingType: listing.listing_type ?? "rent",
        bedrooms: listing.bedrooms ?? null,
        propertyType: listing.property_type ?? null,
        status: lead.status,
        leadCode: (lead as { lead_code?: string }).lead_code,
        publicListingCode:
          (lead as { public_listing_code?: string }).public_listing_code ??
          listing.public_listing_code,
        publicAgentCode:
          (lead as { public_agent_code?: string }).public_agent_code ??
          agent?.public_agent_code,
        listingSlug:
          (lead as { listing_slug?: string }).listing_slug ?? listing.slug,
        listingUrl:
          (lead as { listing_url?: string }).listing_url ??
          listingPublicUrl(listing.slug, lead.listing_id),
        agentHandoffUrl: (lead as { handoff_url?: string }).handoff_url,
        supportReply: (lead as { handoff_message?: string }).handoff_message,
        conciergeStatus: (lead as { concierge_status?: string }).concierge_status,
      }
    : null;

  return (
    <div className="space-y-6">
      <Link
        href={supportPath("leads")}
        className="text-sm font-semibold text-gold-dark"
      >
        ← Back to leads
      </Link>

      <AdminPageHeader
        title={(lead as { lead_code?: string }).lead_code ?? lead.yike_reference}
        description={`${handoff?.title ?? "Listing"} · List ID ${handoff?.publicListingCode ?? "—"}`}
      />

      {handoff && <ConciergeLeadPanel data={handoff} />}

      <div className="flex flex-wrap gap-2">
        {lead.listing?.slug && (
          <Link
            href={`/properties/${lead.listing.slug}`}
            target="_blank"
            className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
          >
            Open property
          </Link>
        )}
        {agent?.id && (
          <Link
            href={`/lex/auth/agents/${agent.id}`}
            className="rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy"
          >
            Agent admin
          </Link>
        )}
      </div>

      <SupportLeadActions
        leadId={lead.id}
        archived={!!lead.archived_at}
        qualityLabel={lead.lead_quality_label ?? null}
      />

      <LeadDisputePanel
        leadId={lead.id}
        disputeStatus={
          (lead as { dispute_status?: string }).dispute_status ?? "none"
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-navy/10 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Timeline
          </h2>
          <div className="mt-4">
            <LeadTimeline events={lead.events ?? []} />
          </div>
        </section>

        <section className="rounded-xl border border-navy/10 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Quick replies
          </h2>
          <div className="mt-4">
            <QuickRepliesPanel compact />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-navy/10 bg-white p-5 text-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          Lead details
        </h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Channel</dt>
            <dd className="font-medium capitalize text-navy">
              {(lead as { channel?: string }).channel ?? lead.lead_type}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Source surface</dt>
            <dd className="text-navy">
              {(lead as { source_surface?: string }).source_surface ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Source page</dt>
            <dd className="text-navy">{lead.source_page ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Inquiry type</dt>
            <dd className="capitalize text-navy">
              {(lead as { inquiry_type?: string }).inquiry_type ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Charge status</dt>
            <dd className="text-navy">
              {(lead as { charge_status?: string }).charge_status ?? "not_chargeable"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Call allowed</dt>
            <dd className="text-navy">
              {(lead as { call_allowed?: boolean | null }).call_allowed == null
                ? "—"
                : (lead as { call_allowed?: boolean }).call_allowed
                  ? "Yes"
                  : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Call route reason</dt>
            <dd className="text-xs text-navy">
              {(lead as { call_route_reason?: string }).call_route_reason ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Duplicate</dt>
            <dd className="text-navy">
              {(lead as { is_duplicate?: boolean }).is_duplicate ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Internal reference</dt>
            <dd className="font-mono text-xs text-muted">{lead.yike_reference}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

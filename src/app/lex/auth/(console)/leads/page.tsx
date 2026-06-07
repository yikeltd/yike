import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminLeads } from "@/lib/leads/queries";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminLeadDealControls } from "@/components/admin/admin-lead-deal-controls";
import { parseAdminPage, ADMIN_PAGE_SIZE } from "@/lib/admin/pagination";
import type { LeadType } from "@/lib/leads/types";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    city?: string;
    agent?: string;
    listing?: string;
    status?: string;
    days?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const { page, from } = parseAdminPage(params);
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const days = Number(params.days ?? 30);
  const fromDate = new Date(Date.now() - days * 86_400_000).toISOString();
  const leadType =
    params.type === "whatsapp" || params.type === "call"
      ? (params.type as LeadType)
      : undefined;

  let countQuery = admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .gte("clicked_at", fromDate);

  if (leadType) countQuery = countQuery.eq("lead_type", leadType);
  if (params.agent) countQuery = countQuery.eq("agent_id", params.agent);
  if (params.listing) countQuery = countQuery.eq("listing_id", params.listing);
  if (params.status) countQuery = countQuery.eq("lead_status", params.status);

  const { count } = await countQuery;
  const total = count ?? 0;

  const leads = await getAdminLeads(admin, {
    leadType,
    leadStatus: params.status,
    city: params.city,
    agentId: params.agent,
    listingId: params.listing,
    from: fromDate,
    limit: ADMIN_PAGE_SIZE,
    offset: from,
  });

  const pageParams = {
    type: params.type,
    city: params.city,
    agent: params.agent,
    listing: params.listing,
    status: params.status,
    days: String(days),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Leads</h1>
        <p className="text-sm text-muted">
          WhatsApp and call inquiries — logged before routing · last {days} days ·{" "}
          {total} total
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-3 text-sm">
        <select
          name="type"
          defaultValue={params.type ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2"
        >
          <option value="">All channels</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="call">Call</option>
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2"
        >
          <option value="">All deal statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="inspection_requested">Inspection requested</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed_won">Closed won</option>
          <option value="closed_lost">Closed lost</option>
          <option value="spam">Spam</option>
        </select>
        <input
          name="city"
          placeholder="City filter"
          defaultValue={params.city ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2"
        />
        <input
          name="agent"
          placeholder="Agent ID"
          defaultValue={params.agent ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2 font-mono text-xs"
        />
        <input
          name="listing"
          placeholder="Listing ID"
          defaultValue={params.listing ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2 font-mono text-xs"
        />
        <select
          name="days"
          defaultValue={String(days)}
          className="rounded-lg border border-navy/15 px-3 py-2"
        >
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-navy px-4 py-2 font-semibold text-white"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-navy/10 bg-surface/50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Deal tracking</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-surface">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                  {new Date(lead.clicked_at).toLocaleString("en-NG")}
                </td>
                <td className="px-4 py-3 capitalize">
                  {lead.inquiry_channel ?? lead.lead_type}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{lead.yike_reference}</td>
                <td className="px-4 py-3">{lead.listing?.title ?? "—"}</td>
                <td className="px-4 py-3">
                  {lead.agent?.full_name ?? lead.agent_id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">
                  <AdminLeadDealControls
                    leadId={lead.id}
                    leadStatus={lead.lead_status}
                    transactionStage={lead.transaction_stage}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <p className="p-6 text-center text-sm text-muted">No leads in this period.</p>
        )}
      </div>

      <AdminPagination
        basePath="/lex/auth/leads"
        total={total}
        page={page}
        params={pageParams}
      />
    </div>
  );
}

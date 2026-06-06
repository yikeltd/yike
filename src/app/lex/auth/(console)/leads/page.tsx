import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminLeads } from "@/lib/leads/queries";
import type { LeadType } from "@/lib/leads/types";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    city?: string;
    agent?: string;
    days?: string;
  }>;
}) {
  const params = await searchParams;
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const days = Number(params.days ?? 30);
  const from = new Date(Date.now() - days * 86_400_000).toISOString();
  const leadType =
    params.type === "whatsapp" || params.type === "call"
      ? (params.type as LeadType)
      : undefined;

  const leads = await getAdminLeads(admin, {
    leadType,
    city: params.city,
    agentId: params.agent,
    from,
    limit: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Leads</h1>
        <p className="text-sm text-muted">
          All WhatsApp and call first-touch events — last {days} days.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-3 text-sm">
        <select
          name="type"
          defaultValue={params.type ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2"
        >
          <option value="">All types</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="call">Call</option>
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
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Source</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-surface">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                  {new Date(lead.clicked_at).toLocaleString("en-NG")}
                </td>
                <td className="px-4 py-3 capitalize">{lead.lead_type}</td>
                <td className="px-4 py-3 font-mono text-xs">{lead.yike_reference}</td>
                <td className="px-4 py-3">{lead.listing?.title ?? "—"}</td>
                <td className="px-4 py-3">{lead.listing?.city ?? "—"}</td>
                <td className="px-4 py-3">{lead.agent?.full_name ?? lead.agent_id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-xs text-muted">{lead.source_page ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <p className="p-6 text-center text-sm text-muted">No leads in this period.</p>
        )}
      </div>
    </div>
  );
}

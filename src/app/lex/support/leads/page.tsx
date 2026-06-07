import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";
import { supportPath } from "@/lib/admin-paths";
import { getSupportLeads } from "@/lib/leads/support-queries";
import { SupportLeadsFilters } from "@/components/support/support-leads-filters";

function statusChip(lead: {
  archived_at?: string | null;
  lead_quality_label?: string | null;
  concierge_status?: string | null;
  status: string;
}) {
  const concierge = lead.concierge_status;
  if (lead.archived_at || concierge === "cancelled") {
    return (
      <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
        {concierge === "cancelled" ? "Cancelled" : "Archived"}
      </span>
    );
  }
  if (lead.lead_quality_label === "spam" || concierge === "spam") {
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
        Spam
      </span>
    );
  }
  if (concierge) {
    return (
      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-navy">
        {concierge.replace(/_/g, " ")}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
      {lead.status}
    </span>
  );
}

export default async function SupportLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; q?: string; channel?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const filter = sp.filter ?? "active";
  const q = sp.q?.trim();
  const channel = sp.channel?.trim();

  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  const archived =
    filter === "archived" ? "archived" : filter === "all" ? "all" : "active";

  const { rows, total } = await getSupportLeads(admin, {
    archived,
    quality:
      filter === "spam"
        ? "spam"
        : filter === "unresolved"
          ? "unresolved"
          : undefined,
    leadType:
      channel === "whatsapp" || channel === "call" ? channel : undefined,
    q,
    limit: to - from + 1,
    offset: from,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads"
        description={`${total} inquiries · search by List ID, agent code, or lead code`}
      />

      <form method="get" className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="List ID, agent code, lead code, slug…"
          className="min-w-[220px] flex-1 rounded-lg border border-navy/15 px-3 py-2 text-sm"
        />
        {filter !== "active" && (
          <input type="hidden" name="filter" value={filter} />
        )}
        <button
          type="submit"
          className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-gold"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {[
          ["", "All channels"],
          ["whatsapp", "WhatsApp"],
          ["call", "Calls"],
        ].map(([value, label]) => (
          <Link
            key={value || "all"}
            href={
              value
                ? `${supportPath("leads")}?channel=${value}${filter !== "active" ? `&filter=${filter}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`
                : `${supportPath("leads")}${filter !== "active" ? `?filter=${filter}` : ""}${q ? `${filter !== "active" ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`
            }
            className={`rounded-full px-3 py-1.5 font-semibold ${
              (channel ?? "") === value
                ? "bg-gold text-navy"
                : "border border-navy/15 bg-white text-navy"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SupportLeadsFilters current={filter} />
        <Link
          href={supportPath("quick-replies")}
          className="text-xs font-semibold text-gold-dark"
        >
          Quick replies →
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-navy/10 bg-surface/50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">List ID</th>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => {
              const row = lead as typeof lead & {
                lead_code?: string;
                public_listing_code?: string;
                public_agent_code?: string;
                source_surface?: string;
                concierge_status?: string;
              };
              return (
                <tr key={lead.id} className="border-b border-surface">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                    {new Date(lead.clicked_at).toLocaleString("en-NG")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.lead_code ?? lead.yike_reference}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">
                    {row.public_listing_code ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">
                      {row.listing_title ?? lead.listing?.title ?? "Listing"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p>{row.agent_name ?? lead.agent?.full_name ?? "—"}</p>
                    <p className="font-mono text-[10px] text-muted">
                      {row.public_agent_code ?? "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-navy">
                    {(row as { inquiry_type?: string }).inquiry_type ??
                      row.channel ??
                      lead.lead_type}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {row.source_surface ?? "—"}
                  </td>
                  <td className="px-4 py-3">{statusChip(row)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={supportPath(`leads/${lead.id}`)}
                      className="text-xs font-semibold text-gold-dark"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted">No leads in this view.</p>
        )}
      </div>

      <AdminPagination
        basePath="/lex/support/leads"
        total={total}
        page={page}
        params={{
          filter: filter === "active" ? undefined : filter,
          channel: channel || undefined,
          q: q || undefined,
        }}
      />
    </div>
  );
}

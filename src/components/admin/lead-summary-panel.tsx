import { getLeadDailySummary } from "@/lib/leads/summary";
import Link from "next/link";
import { adminPath } from "@/lib/admin-paths";

export async function LeadSummaryPanel() {
  const summary = await getLeadDailySummary();
  if (!summary) return null;

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-navy">Lead operations</h2>
        <Link
          href={adminPath("leads")}
          className="text-xs font-semibold text-gold-dark"
        >
          All leads →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Today", summary.leadsToday],
          ["This week", summary.leadsWeek],
          ["Direct", summary.directLeads],
          ["Concierge", summary.conciergeLeads],
          ["Dupes blocked", summary.duplicatesBlocked],
          ["Spam", summary.spamMarked],
          ["Chargeable", summary.chargeableLeads],
          [
            "Est. revenue",
            `₦${summary.estimatedRevenue.toLocaleString("en-NG")}`,
          ],
        ].map(([label, val]) => (
          <div
            key={label as string}
            className="rounded-xl border border-navy/8 bg-surface/40 px-3 py-2"
          >
            <p className="text-lg font-black tabular-nums text-navy">{val}</p>
            <p className="text-[10px] font-semibold uppercase text-muted">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-muted">
            Top agents today
          </p>
          <ul className="space-y-1">
            {summary.topAgents.length === 0 ? (
              <li className="text-muted">—</li>
            ) : (
              summary.topAgents.map((a) => (
                <li key={a.agent_id} className="flex justify-between gap-2">
                  <Link
                    href={adminPath(`agents/${a.agent_id}`)}
                    className="font-medium text-navy hover:text-gold-dark"
                  >
                    {a.full_name ?? a.agent_id.slice(0, 8)}
                  </Link>
                  <span className="tabular-nums text-muted">{a.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-muted">
            Top listings today
          </p>
          <ul className="space-y-1">
            {summary.topListings.length === 0 ? (
              <li className="text-muted">—</li>
            ) : (
              summary.topListings.map((l) => (
                <li key={l.listing_id} className="flex justify-between gap-2">
                  <span className="truncate font-medium text-navy">
                    {l.title ?? l.listing_id.slice(0, 8)}
                  </span>
                  <span className="tabular-nums text-muted">{l.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

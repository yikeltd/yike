import Link from "next/link";
import { requireAuth, getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { canListProperties } from "@/lib/agent-tiers";
import { getAgentLeadStats, getAgentLeads } from "@/lib/leads/queries";

export default async function AgentLeadsPage() {
  const user = await requireAuth("/auth/login?next=/agent/leads");
  const profile = await getProfile(user.id);
  const admin = createAdminClient();

  if (!profile || !canListProperties(profile) || !admin) {
    return (
      <div className="space-y-4 pt-4">
        <p className="text-muted">Become an agent to view lead analytics.</p>
        <Link href="/agent/become" className="font-semibold text-gold-dark">
          Become an agent →
        </Link>
      </div>
    );
  }

  const [stats, leads] = await Promise.all([
    getAgentLeadStats(admin, user.id),
    getAgentLeads(admin, user.id, 30),
  ]);

  return (
    <div className="space-y-6 pt-4">
      <div>
        <Link href="/agent" className="text-sm font-semibold text-gold-dark">
          ← Agent hub
        </Link>
        <h1 className="mt-2 text-xl font-bold">Your leads</h1>
        <p className="text-sm text-muted">
          WhatsApp and call taps from renters on Yike.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="WhatsApp leads" value={stats.whatsapp} hint="This week & all time" />
        <Stat label="Calls" value={stats.call} />
        <Stat label="This week" value={stats.week} highlight />
        <Stat label="All time" value={stats.total} />
      </div>

      {stats.week > 0 && (
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 text-sm">
          <p className="font-bold text-navy">
            {stats.whatsapp} WhatsApp lead{stats.whatsapp === 1 ? "" : "s"} recorded
          </p>
          <p className="mt-1 text-muted">
            Renters found you through Yike this week. Keep listings fresh and
            respond fast on WhatsApp to rank higher.
          </p>
        </div>
      )}

      {stats.topListing && (
        <div className="card-shadow rounded-xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Top listing
          </p>
          <p className="mt-1 font-semibold">{stats.topListing.title}</p>
          <p className="text-sm text-muted">{stats.topListing.count} leads</p>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold text-navy">Recent leads</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-muted">
            No leads yet. Share your listings to get WhatsApp messages.
          </p>
        ) : (
          <ul className="space-y-2">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="card-shadow rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold capitalize">{lead.lead_type}</p>
                    <p className="text-muted">
                      {lead.listing?.title ?? "Listing"} ·{" "}
                      {lead.listing?.area}, {lead.listing?.city}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-gold-dark">
                    {lead.yike_reference}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {new Date(lead.clicked_at).toLocaleString("en-NG")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card-shadow rounded-xl border p-4 ${
        highlight ? "border-gold/30 bg-gold/5" : "border-border"
      }`}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-muted">{hint}</p> : null}
    </div>
  );
}

import Link from "next/link";
import { requireServerClient } from "@/lib/supabase/require-client";
import { supportPath } from "@/lib/admin-paths";
import {
  AdminPageHeader,
  MetricCard,
} from "@/components/admin/dashboard/admin-ui";
import { LeadSummaryPanel } from "@/components/admin/lead-summary-panel";

export default async function SupportDashboardPage() {
  const supabase = await requireServerClient();

  const [openReports, openRequests, recentLeads] = await Promise.all([
    supabase
      .from("listing_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("property_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("leads")
      .select("id, created_at, lead_type, property_id")
      .eq("lead_type", "whatsapp")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Support dashboard"
        description="Open tickets, reports, and customer messages"
      />

      <LeadSummaryPanel />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Open reports"
          value={openReports.count ?? 0}
          href={supportPath("reports")}
          variant={(openReports.count ?? 0) > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Contact messages"
          value={openRequests.count ?? 0}
          href={supportPath("requests")}
        />
        <MetricCard
          label="WhatsApp leads (recent)"
          value={recentLeads.data?.length ?? 0}
          href={supportPath("leads")}
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          Recent WhatsApp support references
        </h2>
        <div className="space-y-2">
          {(recentLeads.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">No recent leads</p>
          ) : (
            (recentLeads.data ?? []).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm"
              >
                <span className="text-navy">WhatsApp lead</span>
                <time className="text-xs text-muted">
                  {new Date(lead.created_at).toLocaleString("en-NG")}
                </time>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

import { requireServerClient } from "@/lib/supabase/require-client";
import Link from "next/link";
import { adminPath } from "@/lib/admin-paths";
import {
  AdminPageHeader,
  MetricCard,
} from "@/components/admin/dashboard/admin-ui";
import { getSession, getProfile } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin/roles";

export default async function AdminOverviewPage() {
  const supabase = await requireServerClient();
  const user = await getSession();
  const profile = user ? await getProfile(user.id) : null;
  const isOwner = profile ? isSuperAdmin(profile.role) : false;

  const [
    activeListings,
    pendingListings,
    activeAgents,
    verifiedAgents,
    whatsappLeads,
    openReports,
    jobApplications,
    recentListings,
    recentAgents,
    recentLeads,
    recentReports,
    recentApplications,
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["agent_unverified", "agent_verified"]),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "agent_verified"),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("lead_type", "whatsapp"),
    supabase
      .from("listing_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("job_applications")
      .select("*", { count: "exact", head: true })
      .in("status", ["review", "shortlisted", "interview"]),
    supabase
      .from("properties")
      .select("id, title, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, full_name, created_at, role")
      .in("role", ["agent_unverified", "agent_verified"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("leads")
      .select("id, created_at, lead_type")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("listing_reports")
      .select("id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("job_applications")
      .select("id, full_name, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const emailOk = await supabase
    .from("email_logs")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("created_at", new Date(Date.now() - 86400000).toISOString());

  const otpFailed = await supabase
    .from("otp_logs")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("created_at", new Date(Date.now() - 86400000).toISOString());

  const systemHealth =
    (otpFailed.count ?? 0) > 10 ? "Degraded" : "Operational";

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Command Center"
        description="Platform overview and quick actions"
        actions={
          <>
            <Link
              href={adminPath("listings")}
              className="pressable rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy"
            >
              Review listings
            </Link>
            {isOwner && (
              <Link
                href={adminPath("staff")}
                className="pressable rounded-xl border border-navy/10 bg-white px-4 py-2 text-sm font-semibold text-navy"
              >
                Manage staff
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active listings"
          value={activeListings.count ?? 0}
          href={adminPath("listings")}
        />
        <MetricCard
          label="Pending listings"
          value={pendingListings.count ?? 0}
          href={adminPath("listings")}
          variant={(pendingListings.count ?? 0) > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Active agents"
          value={activeAgents.count ?? 0}
          href={adminPath("agents")}
        />
        <MetricCard
          label="Verified agents"
          value={verifiedAgents.count ?? 0}
          href={adminPath("agents")}
          variant="success"
        />
        <MetricCard
          label="WhatsApp leads"
          value={whatsappLeads.count ?? 0}
          href={adminPath("leads")}
        />
        <MetricCard
          label="Reports pending"
          value={openReports.count ?? 0}
          href={adminPath("reports")}
          variant={(openReports.count ?? 0) > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Job applications"
          value={jobApplications.count ?? 0}
          href={adminPath("careers/applications")}
        />
        <MetricCard
          label="System health"
          value={systemHealth}
          sub={`${emailOk.count ?? 0} emails · ${otpFailed.count ?? 0} OTP fails (24h)`}
          href={adminPath("health")}
          variant={systemHealth === "Operational" ? "success" : "warning"}
        />
      </div>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
          Recent activity
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <ActivityFeed
            title="New listings"
            items={(recentListings.data ?? []).map((l) => ({
              id: l.id,
              label: l.title,
              meta: l.status,
              time: l.created_at,
            }))}
          />
          <ActivityFeed
            title="Agent signups"
            items={(recentAgents.data ?? []).map((a) => ({
              id: a.id,
              label: a.full_name ?? "Agent",
              meta: a.role,
              time: a.created_at,
            }))}
          />
          <ActivityFeed
            title="Leads generated"
            items={(recentLeads.data ?? []).map((l) => ({
              id: l.id,
              label: `${l.lead_type} lead`,
              time: l.created_at,
            }))}
          />
          <ActivityFeed
            title="Reports filed"
            items={(recentReports.data ?? []).map((r) => ({
              id: r.id,
              label: r.reason,
              time: r.created_at,
            }))}
          />
          <ActivityFeed
            title="Job applications"
            items={(recentApplications.data ?? []).map((a) => ({
              id: a.id,
              label: a.full_name,
              meta: a.status,
              time: a.created_at,
            }))}
          />
        </div>
      </section>
    </div>
  );
}

function ActivityFeed({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string; meta?: string; time: string }[];
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-navy">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted">No recent activity</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 border-b border-surface pb-2 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy">{item.label}</p>
                {item.meta && (
                  <p className="text-[10px] uppercase text-muted">{item.meta}</p>
                )}
              </div>
              <time className="shrink-0 text-[10px] text-muted">
                {new Date(item.time).toLocaleDateString("en-NG")}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

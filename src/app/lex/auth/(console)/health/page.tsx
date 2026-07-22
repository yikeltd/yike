import { requireSuperAdmin } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader, MetricCard } from "@/components/admin/dashboard/admin-ui";
import { EnvHealthPanel } from "@/components/admin/env-health-panel";
import { adminPath } from "@/lib/admin-paths";
import Link from "next/link";
import { TECH_BASE_PATH } from "@/lib/admin-paths";
import { offsetDaysIso } from "@/lib/time";
import { getLaunchFeatureSnapshot } from "@/lib/launch-mode";
import { discoverEnterpriseCapabilities } from "@/lib/enterprise/adapters";

export default async function AdminHealthPage() {
  await requireSuperAdmin();
  const supabase = await requireServerClient();
  const since = offsetDaysIso(-1);

  const [
    emailSent,
    emailFailed,
    otpSent,
    otpFailed,
    propertyLive,
    vehicleLive,
    pendingModeration,
  ] = await Promise.all([
    supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "sent").gte("created_at", since),
    supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
    supabase.from("otp_logs").select("*", { count: "exact", head: true }).eq("status", "sent").gte("created_at", since),
    supabase.from("otp_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .or("asset_type.eq.PROPERTY,asset_type.is.null"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .eq("asset_type", "VEHICLE"),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const flags = getLaunchFeatureSnapshot();
  const enterprise = discoverEnterpriseCapabilities();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System health"
        description="Last 24 hours — summary view"
        actions={
          <Link href={TECH_BASE_PATH} className="text-sm font-semibold text-gold-dark">
            Open tech console →
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Resend (sent)" value={emailSent.count ?? 0} variant="success" />
        <MetricCard label="Email failures" value={emailFailed.count ?? 0} variant={(emailFailed.count ?? 0) > 0 ? "danger" : "default"} />
        <MetricCard label="Sendchamp OTP sent" value={otpSent.count ?? 0} variant="success" />
        <MetricCard label="OTP failures" value={otpFailed.count ?? 0} variant={(otpFailed.count ?? 0) > 0 ? "warning" : "default"} />
      </div>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Marketplace health
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Live property"
            value={propertyLive.count ?? 0}
            href={`${adminPath("listings")}?vertical=property`}
          />
          <MetricCard
            label="Live vehicles"
            value={vehicleLive.count ?? 0}
            href={`${adminPath("listings")}?vertical=vehicle`}
          />
          <MetricCard
            label="Pending moderation"
            value={pendingModeration.count ?? 0}
            href={adminPath("listings/review")}
            variant={(pendingModeration.count ?? 0) > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-navy">Launch feature flags</h2>
        <p className="mt-1 text-xs text-muted">
          Controlled via ENABLE_* env vars · YIKE_LAUNCH_MODE
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {flags.map((f) => (
            <li
              key={f.feature}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs"
            >
              <span className="font-medium text-navy">{f.feature}</span>
              <span
                className={
                  f.visible
                    ? "font-bold text-emerald-700"
                    : "font-semibold text-muted"
                }
              >
                {f.visible ? "ON" : "OFF"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-navy">Enterprise adapters</h2>
        <p className="mt-1 text-xs text-muted">
          Source: {enterprise.source} · {enterprise.generatedAt}
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {enterprise.capabilities.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-border px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-navy">{c.id}</span>
                <span className="text-muted">{c.state}</span>
              </div>
              <p className="mt-1 text-muted">{c.notes}</p>
            </li>
          ))}
        </ul>
      </section>

      <EnvHealthPanel />
      <p className="text-sm text-muted">
        Supabase status: connected. Detailed logs available in{" "}
        <Link href={adminPath("audit-logs")} className="text-gold-dark underline">
          audit logs
        </Link>
        .
      </p>
    </div>
  );
}

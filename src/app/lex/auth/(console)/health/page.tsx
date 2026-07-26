import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { EnvHealthPanel } from "@/components/admin/env-health-panel";
import { LaunchHealthDashboard } from "@/components/admin/launch-health-dashboard";
import { getLaunchHealthSnapshot } from "@/lib/admin/launch-health";
import { getLaunchFeatureSnapshot } from "@/lib/launch-mode";
import { adminPath, TECH_BASE_PATH } from "@/lib/admin-paths";

export default async function AdminHealthPage() {
  await requireSuperAdmin();
  const supabase = await requireServerClient();
  const [snapshot, flags] = await Promise.all([
    getLaunchHealthSnapshot(supabase),
    Promise.resolve(getLaunchFeatureSnapshot()),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Launch Health"
        description="RC / launch-day command center — systems, marketplace, and today’s activity"
        actions={
          <Link
            href={TECH_BASE_PATH}
            className="text-sm font-semibold text-gold-dark"
          >
            Open tech console →
          </Link>
        }
      />

      <LaunchHealthDashboard snapshot={snapshot} />

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

      <EnvHealthPanel />
      <p className="text-sm text-muted">
        Detailed logs:{" "}
        <Link href={adminPath("audit-logs")} className="text-gold-dark underline">
          audit logs
        </Link>
        .
      </p>
    </div>
  );
}

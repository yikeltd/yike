import { requireSuperAdmin } from "@/lib/auth";
import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader, MetricCard } from "@/components/admin/dashboard/admin-ui";
import { EnvHealthPanel } from "@/components/admin/env-health-panel";
import { adminPath } from "@/lib/admin-paths";
import Link from "next/link";
import { TECH_BASE_PATH } from "@/lib/admin-paths";
import { offsetDaysIso } from "@/lib/time";

export default async function AdminHealthPage() {
  await requireSuperAdmin();
  const supabase = await requireServerClient();
  const since = offsetDaysIso(-1);

  const [emailSent, emailFailed, otpSent, otpFailed] = await Promise.all([
    supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "sent").gte("created_at", since),
    supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
    supabase.from("otp_logs").select("*", { count: "exact", head: true }).eq("status", "sent").gte("created_at", since),
    supabase.from("otp_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
  ]);

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

import { requireServerClient } from "@/lib/supabase/require-client";
import { createOtpDbClient } from "@/lib/otp/rpc";
import { getSendchampConfigSummary } from "@/lib/notifications/providers/sendchamp";
import { EnvHealthPanel } from "@/components/admin/env-health-panel";
import {
  AdminPageHeader,
  MetricCard,
} from "@/components/admin/dashboard/admin-ui";

export default async function TechDashboardPage() {
  const supabase = await requireServerClient();
  const sendchamp = getSendchampConfigSummary();
  const otpDbConfigured = Boolean(createOtpDbClient());
  const since = new Date(Date.now() - 86400000).toISOString();

  const [emailSent, emailFailed, otpSent, otpFailed, recentOtpErrors, recentEmailErrors] =
    await Promise.all([
      supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "sent").gte("created_at", since),
      supabase.from("email_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
      supabase.from("otp_logs").select("*", { count: "exact", head: true }).in("status", ["sent", "delivered"]).gte("created_at", since),
      supabase.from("otp_logs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
      supabase.from("otp_logs").select("*").eq("status", "failed").order("created_at", { ascending: false }).limit(5),
      supabase.from("email_logs").select("*").eq("status", "failed").order("created_at", { ascending: false }).limit(5),
    ]);

  const otpTotal = (otpSent.count ?? 0) + (otpFailed.count ?? 0);
  const otpFailRate = otpTotal > 0 ? Math.round(((otpFailed.count ?? 0) / otpTotal) * 100) : 0;
  const emailTotal = (emailSent.count ?? 0) + (emailFailed.count ?? 0);
  const emailFailRate = emailTotal > 0 ? Math.round(((emailFailed.count ?? 0) / emailTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Tech health dashboard"
        description="Monitoring — last 24 hours"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Resend status" value={emailFailed.count === 0 ? "OK" : "Issues"} sub={`${emailSent.count ?? 0} sent · ${emailFailRate}% fail`} variant={emailFailed.count === 0 ? "success" : "warning"} />
        <MetricCard label="Sendchamp status" value={sendchamp.configured ? "Configured" : "Missing key"} sub={otpDbConfigured ? "OTP RPC OK" : "OTP token missing"} variant={sendchamp.configured && otpDbConfigured ? "success" : "danger"} href="/lex/tech/otp" />
        <MetricCard label="Sendchamp delivery" value={otpFailed.count === 0 ? "OK" : "Issues"} sub={`${otpSent.count ?? 0} sent · ${otpFailRate}% fail`} variant={otpFailed.count === 0 ? "success" : "warning"} href="/lex/tech/otp" />
        <MetricCard label="Supabase" value="Connected" variant="success" />
        <MetricCard label="OTP failure rate" value={`${otpFailRate}%`} href="/lex/tech/otp" variant={otpFailRate > 5 ? "danger" : "default"} />
        <MetricCard label="Email failure rate" value={`${emailFailRate}%`} href="/lex/tech/email" variant={emailFailRate > 5 ? "danger" : "default"} />
        <MetricCard label="Deployment" value={process.env.VERCEL_ENV ?? "local"} sub={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev"} />
      </div>

      <EnvHealthPanel />

      <section className="grid gap-4 lg:grid-cols-2">
        <ErrorList title="Latest OTP errors" items={(recentOtpErrors.data ?? []).map((e) => ({ id: e.id, label: `${e.phone} — ${e.error_message ?? e.channel ?? "failed"}`, time: e.created_at }))} />
        <ErrorList title="Latest email errors" items={(recentEmailErrors.data ?? []).map((e) => ({ id: e.id, label: e.email, time: e.created_at }))} />
      </section>
    </div>
  );
}

function ErrorList({
  title,
  items,
}: {
  title: string;
  items: { id: string; label: string; time: string }[];
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-navy">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted">No errors</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between text-xs">
              <span className="text-navy">{item.label}</span>
              <time className="text-muted">{new Date(item.time).toLocaleString("en-NG")}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

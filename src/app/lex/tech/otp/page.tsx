import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";
import { getSendchampConfigSummary } from "@/lib/notifications/providers/sendchamp";
import { createOtpDbClient } from "@/lib/otp/rpc";
import {
  isEmailOtpEnabled,
  isPhoneOtpEnabled,
  isSmsOtpEnabled,
  isWhatsappOtpEnabled,
} from "@/lib/feature-flags";

export default async function OtpFailuresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();
  const since = new Date(Date.now() - 86400000).toISOString();

  const sendchamp = getSendchampConfigSummary();
  const otpDbConfigured = Boolean(createOtpDbClient());
  const phoneOtpLive = isPhoneOtpEnabled();
  const emailOtpLive = isEmailOtpEnabled();

  const [
    { data, count },
    { count: sentWa },
    { count: sentSms },
    { count: failedWa },
    { count: failedSms },
    { data: lastFailedRows },
  ] = await Promise.all([
    supabase
      .from("otp_logs")
      .select("*", { count: "exact" })
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("otp_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .eq("channel", "whatsapp")
      .gte("created_at", since),
    supabase
      .from("otp_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent")
      .eq("channel", "sms")
      .gte("created_at", since),
    supabase
      .from("otp_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .eq("channel", "whatsapp")
      .gte("created_at", since),
    supabase
      .from("otp_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .eq("channel", "sms")
      .gte("created_at", since),
    supabase
      .from("otp_logs")
      .select("*")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const total = count ?? 0;
  const lastFailed = lastFailedRows?.[0] ?? null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="OTP diagnostics"
        description="Sendchamp delivery health — last 24 hours"
      />

      <div className="rounded-2xl border border-navy/10 bg-white p-4 text-sm shadow-sm">
        <h2 className="font-bold text-navy">Launch auth mode</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email OTP</dt>
            <dd className="font-medium text-navy">{emailOtpLive ? "Active" : "Disabled"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Phone OTP (SMS / WhatsApp)</dt>
            <dd className="font-medium text-navy">
              {phoneOtpLive ? "Active" : "Temporarily disabled for launch"}
            </dd>
          </div>
        </dl>
        {!phoneOtpLive && (
          <p className="mt-3 text-muted">
            Launch authentication currently uses email OTP. Provider adapters, logs, and cooldown
            infrastructure remain in place — re-enable with{" "}
            <code className="rounded bg-black/5 px-1">ENABLE_PHONE_OTP=true</code> when ready.
          </p>
        )}
        {phoneOtpLive && (
          <p className="mt-3 text-xs text-muted">
            SMS: {isSmsOtpEnabled() ? "on" : "off"} · WhatsApp: {isWhatsappOtpEnabled() ? "on" : "off"}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DiagCard
          label="Sendchamp configured"
          value={sendchamp.configured ? "Yes" : "No"}
          ok={sendchamp.configured}
        />
        <DiagCard
          label="OTP RPC token"
          value={otpDbConfigured ? "OK" : "Missing"}
          ok={otpDbConfigured}
        />
        <DiagCard
          label="WhatsApp (24h)"
          value={`${sentWa ?? 0} sent · ${failedWa ?? 0} failed`}
          ok={(failedWa ?? 0) === 0}
        />
        <DiagCard
          label="SMS (24h)"
          value={`${sentSms ?? 0} sent · ${failedSms ?? 0} failed`}
          ok={(failedSms ?? 0) === 0}
        />
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-4 text-sm shadow-sm">
        <h2 className="font-bold text-navy">Provider config</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <ConfigRow label="Public key" ok={sendchamp.publicKeyConfigured ?? false} />
          <ConfigRow label="Base URL" ok={sendchamp.baseUrlConfigured ?? false} />
          <ConfigRow
            label="SMS sender"
            ok={sendchamp.configured ? sendchamp.smsSenderConfigured : false}
            detail={
              sendchamp.configured
                ? sendchamp.smsSenderRaw &&
                  sendchamp.smsSenderRaw !== sendchamp.smsSender
                  ? `${sendchamp.smsSenderRaw} → ${sendchamp.smsSender}`
                  : sendchamp.smsSender
                : undefined
            }
          />
          <ConfigRow
            label="WhatsApp sender"
            ok={sendchamp.configured ? sendchamp.whatsappSenderConfigured : false}
            detail={
              sendchamp.configured && sendchamp.whatsappSender
                ? sendchamp.whatsappSender
                : undefined
            }
          />
        </dl>
        {sendchamp.configured && (sendchamp.envWarnings?.length ?? 0) > 0 && (
          <ul className="mt-4 space-y-1 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {sendchamp.envWarnings!.map((warning) => (
              <li key={warning}>⚠ {warning}</li>
            ))}
          </ul>
        )}
        {lastFailed && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
            <strong>Last error:</strong>{" "}
            {lastFailed.error_message ?? "Unknown"} ({lastFailed.channel ?? "—"} ·{" "}
            {new Date(lastFailed.created_at).toLocaleString("en-NG")})
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-surface/80">
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Phone</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Channel</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Error</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {(data ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-mono text-xs">{row.phone}</td>
                <td className="px-4 py-3 text-xs uppercase">{row.channel ?? "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 text-xs text-red-700">
                  {row.error_message ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                  {new Date(row.created_at).toLocaleString("en-NG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPagination basePath="/lex/tech/otp" total={total} page={page} />
    </div>
  );
}

function DiagCard({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold ${ok ? "text-emerald-700" : "text-red-700"}`}>
        {value}
      </p>
    </div>
  );
}

function ConfigRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-surface/60 px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-semibold ${ok ? "text-emerald-700" : "text-red-700"}`}>
        {ok ? "OK" : "Missing"}
        {detail ? <span className="ml-1 font-normal text-navy">({detail})</span> : null}
      </dd>
    </div>
  );
}

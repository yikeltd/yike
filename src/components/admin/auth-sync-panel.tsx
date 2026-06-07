"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

export function AuthSyncPanel({
  stats,
}: {
  stats: {
    authCount: number;
    profileCount: number;
    missingCount: number;
    agentCount: number;
    companyCount: number;
    emailOtpEnabled: boolean;
    otpRpcReady: boolean;
    resendReady: boolean;
    adminReady: boolean;
  };
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function bulkRepair() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/users/repair-missing", { method: "POST" });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      repaired?: number;
      failed?: number;
    };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Bulk repair failed");
      return;
    }
    setMessage(`Repaired ${data.repaired ?? 0} profile(s). Failed: ${data.failed ?? 0}.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {pinModal}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Auth users" value={stats.authCount} />
        <StatCard label="Profile rows" value={stats.profileCount} />
        <StatCard
          label="Missing profiles"
          value={stats.missingCount}
          warn={stats.missingCount > 0}
        />
        <StatCard label="Agents" value={stats.agentCount} />
        <StatCard label="Companies" value={stats.companyCount} />
        <StatCard label="Admin API" value={stats.adminReady ? "OK" : "Down"} warn={!stats.adminReady} />
      </div>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-bold text-navy">Email OTP</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          <li>ENABLE_EMAIL_OTP: {stats.emailOtpEnabled ? "on" : "off"}</li>
          <li>OTP RPC client: {stats.otpRpcReady ? "ready" : "missing token/URL"}</li>
          <li>Resend API: {stats.resendReady ? "configured" : "RESEND_API_KEY missing"}</li>
        </ul>
        <p className="mt-3 text-xs text-muted">
          Ops probe: GET /api/health/auth-email with CRON_SECRET
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <h2 className="font-bold text-navy">Repair missing profiles</h2>
        <p className="mt-1 text-sm text-muted">
          Creates profile rows for auth users that have no public.profiles entry. Requires admin PIN.
        </p>
        <Button
          type="button"
          className="mt-4"
          disabled={busy || stats.missingCount === 0}
          onClick={() => requirePin(() => void bulkRepair())}
        >
          Repair all missing ({stats.missingCount})
        </Button>
        {message && <p className="mt-3 text-sm text-navy">{message}</p>}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        warn ? "border-amber-200 bg-amber-50" : "border-border bg-white"
      }`}
    >
      <p className="text-xs font-bold uppercase text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

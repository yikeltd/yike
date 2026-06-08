"use client";

import { useCallback, useEffect, useState } from "react";

type EnvHealth = {
  ok: boolean;
  env: Record<string, "present" | "missing">;
  emailSenderConfigured: boolean;
  otpRouteReady: boolean;
  emailOtpEnabled: boolean;
  resendConfigured: boolean;
  supabaseServiceRole: {
    configured: boolean;
    ok: boolean;
    keyFormat: string;
    authAdminReachable: boolean;
    profilesReachable: boolean;
    error?: string;
  };
  supabaseAdminAuth: "OK" | "Failed";
  profilesQuery: "OK" | "Failed";
  authEmailFromDomain: string | null;
};

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
          : "inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800"
      }
    >
      {label}
    </span>
  );
}

export function EnvHealthPanel() {
  const [data, setData] = useState<EnvHealth | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/env-health");
    const json = (await res.json().catch(() => ({}))) as EnvHealth & { error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Could not load env health");
      return;
    }
    setData(json);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  if (loading && !data) {
    return <p className="text-sm text-muted">Checking environment…</p>;
  }

  if (error) {
    return <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>;
  }

  if (!data) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-navy">Production env health</h2>
        <StatusBadge ok={data.ok} label={data.ok ? "All checks pass" : "Issues detected"} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(data.env).map(([key, status]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-xl border border-navy/5 px-3 py-2 text-sm"
          >
            <span className="font-mono text-xs text-navy">{key}</span>
            <StatusBadge ok={status === "present"} label={status} />
          </div>
        ))}
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-surface/60 px-3 py-2">
          <dt className="text-xs text-muted">Email sender</dt>
          <dd className="mt-1 font-medium text-navy">
            {data.emailSenderConfigured ? "Configured" : "Not configured"}
            {data.authEmailFromDomain ? ` · ${data.authEmailFromDomain}` : ""}
          </dd>
        </div>
        <div className="rounded-xl bg-surface/60 px-3 py-2">
          <dt className="text-xs text-muted">OTP route</dt>
          <dd className="mt-1 font-medium text-navy">
            {data.otpRouteReady ? "Ready" : "Not ready"}
            {!data.emailOtpEnabled ? " (flag off)" : ""}
          </dd>
        </div>
        <div className="rounded-xl bg-surface/60 px-3 py-2 sm:col-span-2">
          <dt className="text-xs text-muted">Supabase service role</dt>
          <dd className="mt-1 font-medium text-navy">
            {data.supabaseServiceRole.ok ? "Reachable" : "Unreachable"}
            {data.supabaseServiceRole.error ? (
              <span className="block text-xs font-normal text-muted">
                {data.supabaseServiceRole.error}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="rounded-xl bg-surface/60 px-3 py-2">
          <dt className="text-xs text-muted">Supabase Admin Auth</dt>
          <dd className="mt-1 font-medium text-navy">{data.supabaseAdminAuth}</dd>
        </div>
        <div className="rounded-xl bg-surface/60 px-3 py-2">
          <dt className="text-xs text-muted">Profiles Query</dt>
          <dd className="mt-1 font-medium text-navy">{data.profilesQuery}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => void load()}
        className="text-sm font-semibold text-gold-dark hover:underline"
      >
        Refresh
      </button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

type SafeHavenHealth = {
  statusLabel: string;
  status: string;
  environment: string;
  enabled: boolean;
  vaEnabled: boolean;
  transfersEnabled: boolean;
  webhooksEnabled: boolean;
  clientIdPresent: boolean;
  clientSecretPresent: boolean;
  privateKeyPresent: boolean;
  baseUrlPresent: boolean;
  webhookSecretPresent: boolean;
  businessIdPresent: boolean;
  settlementAccountConfigured: boolean;
  webhookUrl: string;
  configured: boolean;
  missingRequired: string[];
};

function BoolBadge({ ok, yes = "yes", no = "no" }: { ok: boolean; yes?: string; no?: string }) {
  return (
    <span
      className={
        ok
          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800"
          : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900"
      }
    >
      {ok ? yes : no}
    </span>
  );
}

export function SafeHavenHealthPanel() {
  const { requirePin, pinModal } = usePinGate();
  const [data, setData] = useState<SafeHavenHealth | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [oauthMessage, setOauthMessage] = useState("");
  const [oauthBusy, setOauthBusy] = useState(false);
  const [healthBusy, setHealthBusy] = useState(false);
  const [healthMessage, setHealthMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/safehaven/health");
    const json = (await res.json().catch(() => ({}))) as SafeHavenHealth & {
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Could not load Safe Haven status");
      return;
    }
    setData(json);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function testHealth() {
    setHealthBusy(true);
    setHealthMessage("");
    const res = await fetch("/api/admin/safehaven/test-health", { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    setHealthBusy(false);
    if (!res.ok || !json.ok) {
      setHealthMessage(json.error ?? "Provider health check failed.");
      return;
    }
    setHealthMessage("Provider API reachable.");
  }

  async function testOAuth() {
    setOauthBusy(true);
    setOauthMessage("");
    const res = await fetch("/api/admin/safehaven/test-oauth", { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      expiresAt?: string;
    };
    setOauthBusy(false);
    if (!res.ok || !json.ok) {
      setOauthMessage(json.error ?? "OAuth test failed.");
      return;
    }
    setOauthMessage(`OAuth OK · expires ${json.expiresAt ?? "soon"}`);
  }

  async function copyWebhookUrl() {
    if (!data?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(data.webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading && !data) {
    return <p className="text-sm text-muted">Checking Safe Haven…</p>;
  }

  if (error) {
    return <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>;
  }

  if (!data) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-navy">Safe Haven</h2>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-navy">
          {data.statusLabel}
        </span>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <Row label="Environment" value={data.environment} />
        <Row label="Master switch" value={data.enabled ? "Enabled" : "Disabled"} />
        <Row label="Client ID" badge={<BoolBadge ok={data.clientIdPresent} />} />
        <Row label="Client secret" badge={<BoolBadge ok={data.clientSecretPresent} />} />
        <Row label="Private key" badge={<BoolBadge ok={data.privateKeyPresent} />} />
        <Row label="Base URL" badge={<BoolBadge ok={data.baseUrlPresent} />} />
        <Row label="Webhook secret" badge={<BoolBadge ok={data.webhookSecretPresent} />} />
        <Row
          label="Settlement account"
          badge={
            <BoolBadge
              ok={data.settlementAccountConfigured}
              yes="configured"
              no="not configured"
            />
          }
        />
        <Row label="VA enabled" badge={<BoolBadge ok={data.vaEnabled} />} />
        <Row label="Transfers enabled" badge={<BoolBadge ok={data.transfersEnabled} />} />
        <Row label="Webhooks enabled" badge={<BoolBadge ok={data.webhooksEnabled} />} />
      </dl>

      {data.missingRequired.length > 0 ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Missing when ENABLE_SAFEHAVEN=true: {data.missingRequired.join(", ")}
        </p>
      ) : null}

      <div className="rounded-xl border border-navy/8 bg-surface/50 px-3 py-3">
        <p className="text-xs font-semibold text-navy">Webhook URL</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="break-all text-xs text-muted">{data.webhookUrl}</code>
          <button
            type="button"
            onClick={() => void copyWebhookUrl()}
            className="pressable rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-gold"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={oauthBusy || !data.configured}
          onClick={() => requirePin(() => void testOAuth())}
          className="pressable rounded-xl bg-navy px-4 py-2 text-xs font-bold text-gold disabled:opacity-50"
        >
          {oauthBusy ? "Testing OAuth…" : "Test OAuth token"}
        </button>
        <button
          type="button"
          disabled={healthBusy || !data.configured}
          onClick={() => requirePin(() => void testHealth())}
          className="pressable rounded-xl border border-navy/15 px-4 py-2 text-xs font-semibold text-navy disabled:opacity-50"
        >
          {healthBusy ? "Checking…" : "Test provider health"}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="pressable rounded-xl border border-navy/15 px-4 py-2 text-xs font-semibold text-navy"
        >
          Refresh
        </button>
      </div>

      {oauthMessage ? <p className="text-xs text-muted">{oauthMessage}</p> : null}
      {healthMessage ? <p className="text-xs text-muted">{healthMessage}</p> : null}
      {pinModal}
    </div>
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-navy/5 px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-xs font-medium text-navy">{badge ?? value}</dd>
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";

export function SubscriptionRenewCard({
  planLabel,
  expiresAt,
  foundingMember,
}: {
  planLabel: string;
  expiresAt: string | null;
  foundingMember?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  async function renew() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/subscriptions/renew", { method: "POST" });
    const data = (await res.json()) as { authorizationUrl?: string; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Renewal failed");
      return;
    }
    if (data.authorizationUrl) {
      window.location.assign(data.authorizationUrl);
    } else {
      window.location.reload();
    }
  }

  if (!expiresAt) return null;

  const exp = new Date(expiresAt);
  const daysLeft = Math.ceil((exp.getTime() - now) / 86_400_000);

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-sm font-bold text-navy">{planLabel} plan</p>
      <p className="mt-1 text-xs text-muted">
        Renews manually — expires {exp.toLocaleDateString("en-NG")}
        {daysLeft <= 7 ? ` (${daysLeft}d left)` : ""}
      </p>
      {foundingMember ? (
        <p className="mt-1 text-xs font-medium text-gold">Founding member pricing locked</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void renew()}
        className="mt-3 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
      >
        {busy ? "Starting…" : "Renew for 30 days"}
      </button>
    </div>
  );
}

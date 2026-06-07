"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { FeaturedBadge } from "@/components/ui/badge";
import { isFeaturedActive } from "@/lib/agent-tiers";
import type { FeaturedTier, Property } from "@/types/database";
import { cn } from "@/lib/utils";

const TIERS: { value: FeaturedTier; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
  { value: "launch", label: "Launch" },
  { value: "developer", label: "Developer" },
];

function defaultExpiry(): string {
  const d = new Date(Date.now() + 14 * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function FeaturedListingControls({
  property,
  compact,
}: {
  property: Property;
  compact?: boolean;
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [tier, setTier] = useState<FeaturedTier>(
    (property.featured_tier as FeaturedTier) ?? "basic"
  );
  const [expiry, setExpiry] = useState(
    property.featured_until?.slice(0, 10) ?? defaultExpiry()
  );
  const [reason, setReason] = useState(property.featured_reason ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = isFeaturedActive(property);

  async function runFeature(action: "feature" | "unfeature") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/listings/${property.id}/feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        featured_tier: action === "feature" ? tier : null,
        featured_until:
          action === "feature" && expiry
            ? new Date(`${expiry}T23:59:59`).toISOString()
            : null,
        featured_reason: action === "feature" ? reason : null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {active && (
        <div className="flex flex-wrap items-center gap-2">
          <FeaturedBadge />
          {property.featured_tier && (
            <span className="text-xs font-medium capitalize text-muted">
              {property.featured_tier}
            </span>
          )}
          {property.featured_until && (
            <span className="text-xs text-muted">
              until {new Date(property.featured_until).toLocaleDateString("en-NG")}
            </span>
          )}
        </div>
      )}

      {!compact && (
        <>
          <label className="block text-xs font-semibold text-navy">
            Tier
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as FeaturedTier)}
              className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-navy">
            Expiry date
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-navy">
            Internal note
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why this listing is featured (internal only)"
              className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
            />
          </label>
        </>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className={cn("flex flex-wrap gap-2", compact && "flex-col")}>
        {!active ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => requirePin(() => runFeature("feature"))}
            className="pressable min-h-[40px] rounded-xl bg-navy px-3 text-xs font-bold text-gold"
          >
            {busy ? "…" : "Feature listing"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => requirePin(() => runFeature("unfeature"))}
            className="pressable min-h-[40px] rounded-xl border border-border px-3 text-xs font-semibold"
          >
            {busy ? "…" : "Remove feature"}
          </button>
        )}
        {active && !compact && (
          <button
            type="button"
            disabled={busy}
            onClick={() => requirePin(() => runFeature("feature"))}
            className="pressable min-h-[40px] rounded-xl bg-gold px-3 text-xs font-bold text-navy"
          >
            Update feature
          </button>
        )}
      </div>
      {pinModal}
    </div>
  );
}

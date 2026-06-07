"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import type { Property, YikeVerificationLevel } from "@/types/database";
import { YikeVerifiedBadge } from "@/components/ui/badge";

const LEVELS: { value: YikeVerificationLevel; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "physical", label: "Physical" },
  { value: "document_review", label: "Document review" },
  { value: "developer_partner", label: "Developer partner" },
];

export function YikeVerifiedControls({ property }: { property: Property }) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [verified, setVerified] = useState(!!property.yike_verified);
  const [level, setLevel] = useState<YikeVerificationLevel>(
    (property.yike_verification_level as YikeVerificationLevel) ?? "basic"
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/listings/${property.id}/yike-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        yike_verified: verified,
        yike_verification_level: verified ? level : null,
        reason: reason || null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-dashed border-gold/40 bg-gold/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-navy">Yike Verified</span>
        {property.yike_verified && <YikeVerifiedBadge size="sm" />}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={verified}
          onChange={(e) => setVerified(e.target.checked)}
        />
        Show Yike Verified badge publicly
      </label>
      {verified && (
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as YikeVerificationLevel)}
          className="w-full rounded-lg border border-border px-2 py-2 text-sm"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      )}
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Internal reason (optional)"
        className="w-full rounded-lg border border-border px-2 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => requirePin(save)}
        className="pressable min-h-[36px] rounded-lg bg-navy px-3 text-xs font-bold text-gold"
      >
        {busy ? "…" : "Save verification badge"}
      </button>
      {pinModal}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { UNVERIFIED_AGENT_LISTING_LIMIT, isVerifiedAgentProfile } from "@/lib/agent-tiers";
import type { Profile } from "@/types/database";

const PRESETS = [
  { label: "1 listing", value: 1 },
  { label: "3 listings", value: 3 },
  { label: "5 listings", value: 5 },
  { label: "10 listings", value: 10 },
  { label: "20 listings", value: 20 },
  { label: "Unlimited", value: null as number | null },
] as const;

export function AdminListingLimitControl({
  profile,
  activeCount,
}: {
  profile: Profile;
  activeCount: number;
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const verified = isVerifiedAgentProfile(profile);
  const [preset, setPreset] = useState<number | null>(
    profile.listing_limit ?? (verified ? null : UNVERIFIED_AGENT_LISTING_LIMIT)
  );
  const [custom, setCustom] = useState(
    profile.listing_limit != null ? String(profile.listing_limit) : ""
  );
  const [reason, setReason] = useState(profile.listing_limit_reason ?? "");
  const [useCustom, setUseCustom] = useState(
    profile.listing_limit != null &&
      !PRESETS.some((p) => p.value === profile.listing_limit)
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");
    const limit = useCustom ? Number(custom) || UNVERIFIED_AGENT_LISTING_LIMIT : preset;

    const res = await fetch(`/api/admin/agents/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_limit: limit,
        listing_limit_reason: reason || null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "Update failed");
      return;
    }
    setMessage("Listing limit updated");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
      {pinModal}
      <h2 className="font-bold text-navy">Listing limit control</h2>
      <p className="text-sm text-muted">
        Active listings: <strong>{activeCount}</strong>
        {verified ? " · Verified agent (default unlimited)" : ` · Unverified default: ${UNVERIFIED_AGENT_LISTING_LIMIT}`}
      </p>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setUseCustom(false);
              setPreset(p.value);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
              !useCustom && preset === p.value
                ? "bg-gold text-navy"
                : "bg-surface text-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setUseCustom(true)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
            useCustom ? "bg-gold text-navy" : "bg-surface text-muted"
          }`}
        >
          Custom
        </button>
      </div>

      {useCustom && (
        <Input
          type="number"
          min={0}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Custom limit"
          className="max-w-[8rem]"
        />
      )}

      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Internal reason (optional)"
        className="text-sm"
      />

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
      )}

      <Button disabled={busy} onClick={() => requirePin(() => void save())}>
        Save listing limit (PIN required)
      </Button>
    </section>
  );
}

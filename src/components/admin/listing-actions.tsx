"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const actions = [
  { key: "approved", label: "Approve", style: "bg-gold text-navy font-bold" },
  { key: "rejected", label: "Reject", style: "bg-surface text-foreground" },
  { key: "hidden", label: "Hide", style: "bg-surface text-muted" },
  { key: "rented", label: "Rented", style: "bg-surface text-muted" },
] as const;

export function ListingActions({
  propertyId,
  agentVerified,
  compact,
}: {
  propertyId: string;
  agentVerified?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function update(status: string, extra: Record<string, unknown> = {}) {
    setBusy(status);
    const supabase = createClient();
    await supabase
      .from("properties")
      .update({ status, ...extra })
      .eq("id", propertyId);
    if (status === "approved" || status === "rejected") {
      void fetch("/api/notifications/email/listing-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, status }),
      });
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
        )}
      >
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            disabled={!!busy}
            onClick={() =>
              update(
                a.key,
                a.key === "approved"
                  ? { is_verified_listing: agentVerified }
                  : {}
              )
            }
            className={cn(
              "pressable min-h-[44px] rounded-xl px-2 text-xs font-semibold transition-opacity",
              a.style,
              busy === a.key && "opacity-60"
            )}
          >
            {busy === a.key ? "…" : a.label}
          </button>
        ))}
      </div>
      {!compact && (
        <button
          type="button"
          disabled={!!busy}
          onClick={async () => {
            setBusy("feature");
            const supabase = createClient();
            const featuredUntil = new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString();
            await supabase
              .from("properties")
              .update({
                status: "approved",
                is_featured: true,
                featured_until: featuredUntil,
                boost_score: 50,
                sponsored_status: "boosted",
                is_verified_listing: agentVerified,
              })
              .eq("id", propertyId);
            setBusy(null);
            router.refresh();
          }}
          className="pressable w-full min-h-[44px] rounded-xl bg-navy text-xs font-bold text-gold"
        >
          {busy === "feature" ? "…" : "Feature listing"}
        </button>
      )}
    </div>
  );
}

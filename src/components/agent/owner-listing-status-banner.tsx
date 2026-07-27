"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Property } from "@/types/database";
import {
  canMarkAvailableAgain,
  isListingRented,
  isListingSold,
  isListingUnderReview,
  resolveOwnerBannerKind,
  type AgentListingAction,
  type OwnerListingBannerKind,
} from "@/lib/listing-lifecycle";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { cn } from "@/lib/utils";

const COPY: Record<
  OwnerListingBannerKind,
  { title: string; body: string; tone: "gold" | "amber" | "navy" | "rose" }
> = {
  pending: {
    title: "Your listing is currently under review",
    body: "Submitted → automated checks → human review → approved. Typical review: within 24 hours.",
    tone: "gold",
  },
  flagged: {
    title: "This listing needs a closer look",
    body: "Our team is reviewing it. You can still edit details while you wait.",
    tone: "amber",
  },
  rejected: {
    title: "Not published — updates needed",
    body: "Fix the issues below, then resubmit. Your listing stays in My Listings.",
    tone: "rose",
  },
  expired: {
    title: "This listing has expired",
    body: "Renew to send it back for review and restore marketplace visibility.",
    tone: "amber",
  },
  sold: {
    title: "Marked as Sold",
    body: "Hidden from the public marketplace. You keep full history and can make it available again.",
    tone: "navy",
  },
  rented: {
    title: "Marked as Rented",
    body: "Hidden from the public marketplace. You keep full history and can make it available again.",
    tone: "navy",
  },
  archived: {
    title: "Archived — hidden from buyers",
    body: "Restore when you are ready to list again.",
    tone: "navy",
  },
  hidden: {
    title: "Temporarily hidden",
    body: "Not shown to buyers. Edit or restore when ready.",
    tone: "amber",
  },
  unavailable: {
    title: "Marked unavailable",
    body: "Hidden from search. Make available again when the listing is ready.",
    tone: "amber",
  },
};

const TONE_CLASS = {
  gold: "border-gold/35 bg-gold/10",
  amber: "border-amber-200/70 bg-amber-50/90",
  navy: "border-navy/15 bg-navy/[0.04]",
  rose: "border-rose-200/70 bg-rose-50/90",
} as const;

/**
 * Owner-only status banner + management actions on listing detail.
 * Presentation/actions only — uses existing lifecycle API.
 */
export function OwnerListingStatusBanner({
  property,
  className,
}: {
  property: Property;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const kind = resolveOwnerBannerKind(property);
  const isVehicle = normalizeAssetType(property.asset_type) === "VEHICLE";
  const copy = kind ? COPY[kind] : null;

  async function run(action: AgentListingAction, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/agent/listings/${property.id}/lifecycle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        alert(data?.error ?? "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const showMarkSold =
    property.status === "approved" &&
    !isListingSold(property) &&
    !isListingRented(property) &&
    (isVehicle || property.listing_type === "sale");

  const showMarkRented =
    !isVehicle &&
    property.status === "approved" &&
    !isListingSold(property) &&
    !isListingRented(property) &&
    (property.listing_type === "rent" ||
      property.listing_type === "lease" ||
      property.listing_type === "shortlet");

  const showAvailableAgain = canMarkAvailableAgain(property);

  if (!copy && !showMarkSold && !showMarkRented && !showAvailableAgain) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-navy/10 bg-white px-4 py-3 shadow-[0_4px_16px_-12px_rgba(3,27,78,0.14)]",
          className,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-navy">Owner preview</p>
          <OwnerActionLinks propertyId={property.id} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3.5 shadow-[0_4px_16px_-12px_rgba(3,27,78,0.12)]",
        copy ? TONE_CLASS[copy.tone] : "border-navy/10 bg-white",
        className,
      )}
    >
      {copy ? (
        <div>
          <p className="text-sm font-bold text-navy">{copy.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-navy/65">{copy.body}</p>
          {kind === "rejected" && property.moderation_note ? (
            <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-navy/80">
              <span className="font-semibold">Reason: </span>
              {property.moderation_note}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm font-semibold text-navy">Owner preview</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/agent/listings/${property.id}/edit`}
          className="pressable rounded-full bg-gold px-3.5 py-1.5 text-xs font-bold text-navy"
        >
          Edit
        </Link>
        <Link
          href="/agent/listings"
          className="pressable rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold text-navy ring-1 ring-navy/10"
        >
          My listings
        </Link>
        {showMarkSold ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                "mark_sold",
                "Mark as Sold? This listing will disappear from the public marketplace. You can still view it here.",
              )
            }
            className="pressable rounded-full bg-navy px-3.5 py-1.5 text-xs font-bold text-gold disabled:opacity-50"
          >
            Mark Sold
          </button>
        ) : null}
        {showMarkRented ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                "mark_rented",
                "Mark as Rented? This listing will disappear from the public marketplace. You can still view it here.",
              )
            }
            className="pressable rounded-full bg-navy px-3.5 py-1.5 text-xs font-bold text-gold disabled:opacity-50"
          >
            Mark Rented
          </button>
        ) : null}
        {showAvailableAgain ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                "reactivate",
                "Make this listing available again? It will go back for review before appearing publicly.",
              )
            }
            className="pressable rounded-full bg-navy px-3.5 py-1.5 text-xs font-bold text-gold disabled:opacity-50"
          >
            {kind === "expired" ? "Renew" : "Available Again"}
          </button>
        ) : null}
        {kind !== "archived" && kind !== "sold" && !isListingUnderReview(property) ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run("archive", "Archive this listing? Buyers will no longer see it.")}
            className="pressable rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold text-navy/70 ring-1 ring-navy/10 disabled:opacity-50"
          >
            Archive
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OwnerActionLinks({ propertyId }: { propertyId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/agent/listings/${propertyId}/edit`}
        className="pressable rounded-full bg-gold px-3.5 py-1.5 text-xs font-bold text-navy"
      >
        Edit
      </Link>
      <Link
        href="/agent/listings"
        className="pressable rounded-full bg-navy/[0.05] px-3.5 py-1.5 text-xs font-bold text-navy"
      >
        My listings
      </Link>
    </div>
  );
}

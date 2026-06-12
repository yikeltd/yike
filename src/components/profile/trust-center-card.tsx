"use client";

import Link from "next/link";
import {
  Check,
  Circle,
  Clock,
} from "lucide-react";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  getTrustProgressItems,
  getTrustStatusChip,
  trustProgressPercent,
  type TrustItemStatus,
  type TrustProgressItem,
} from "@/lib/verification/trust-center";

const SETUP_HREF = "/agent/verification";

function StatusIcon({ status }: { status: TrustItemStatus }) {
  switch (status) {
    case "complete":
      return <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />;
    case "under_review":
      return <Clock className="h-3.5 w-3.5 text-amber-600" />;
    case "action_needed":
      return <Circle className="h-3.5 w-3.5 text-muted" />;
    default:
      return <Circle className="h-3.5 w-3.5 text-muted/50" />;
  }
}

function chipClasses(tone: ReturnType<typeof getTrustStatusChip>["tone"]) {
  switch (tone) {
    case "premium":
      return "bg-gold/20 text-navy";
    case "success":
      return "bg-emerald-50 text-emerald-800";
    case "warning":
      return "bg-amber-50 text-amber-900";
    default:
      return "bg-surface text-muted";
  }
}

function TrustRow({ item, compact }: { item: TrustProgressItem; compact?: boolean }) {
  const label =
    item.status === "complete"
      ? item.label
      : item.status === "under_review"
        ? `${item.label} — under review`
        : item.label;

  return (
    <li className={cn("flex items-center gap-2.5", compact && "text-xs")}>
      <StatusIcon status={item.status} />
      <span
        className={cn(
          "flex-1",
          item.status === "complete" ? "text-muted" : "text-navy",
          compact && item.status === "complete" && "line-through decoration-muted/40"
        )}
      >
        {label}
      </span>
      {item.status !== "complete" && item.href ? (
        <Link href={item.href} prefetch className="text-xs font-semibold text-navy">
          Continue
        </Link>
      ) : null}
    </li>
  );
}

export function TrustCenterCard({
  profile,
  verified,
  variant = "summary",
  className,
  hideItemIds = [],
  showOptionalUpgrades = false,
}: {
  profile: Profile;
  verified: boolean;
  variant?: "summary" | "detail";
  className?: string;
  hideItemIds?: string[];
  showOptionalUpgrades?: boolean;
}) {
  const chip = getTrustStatusChip(profile, verified);
  const items = getTrustProgressItems(profile, verified).filter(
    (item) => !hideItemIds.includes(item.id)
  );
  const percent = trustProgressPercent(items);
  const listingItems = items.filter((i) => i.group === "listing_setup");
  const trustItems = showOptionalUpgrades
    ? items.filter((i) => i.group === "trust_upgrade")
    : [];
  const listingIncomplete = listingItems.filter(
    (i) => i.status === "action_needed" || i.status === "under_review"
  );
  const completed = items.filter((i) => i.status === "complete");
  const allDone = listingIncomplete.length === 0;

  if (variant === "summary") {
    return (
      <section
        className={cn(
          "yike-card yike-card-compact",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold leading-tight text-navy">Profile — {percent}%</p>
          {!allDone ? (
            <span className={cn("yike-status-pill", chipClasses(chip.tone))}>
              {chip.label}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-navy/10">
          <div
            className="h-full rounded-full bg-navy transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <Link
          href={SETUP_HREF}
          prefetch
          className="yike-cta-glow pressable mt-2 flex w-full items-center justify-center rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white"
        >
          Continue
        </Link>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "yike-card",
        className
      )}
    >
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold leading-tight text-navy">Profile — {percent}%</p>
          <span className={cn("yike-status-pill", chipClasses(chip.tone))}>
            {chip.label}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-navy/10">
          <div
            className="h-full rounded-full bg-navy transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="px-3 py-2.5">
        {listingItems.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-navy/55">
              Required to list
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {listingItems.map((item) => (
                <TrustRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ) : null}

        {trustItems.length > 0 ? (
          <div className={cn(listingItems.length > 0 && "mt-4")}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-navy/60">
              Optional upgrades
            </p>
            <ul className="mt-2 space-y-1.5">
              {trustItems.map((item) => (
                <TrustRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ) : null}

        {completed.length > 0 && listingIncomplete.length === 0 ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-muted">
              Completed ({completed.length})
            </summary>
            <ul className="mt-2 space-y-1.5">
              {completed.map((item) => (
                <TrustRow key={item.id} item={item} compact />
              ))}
            </ul>
          </details>
        ) : null}

      </div>
    </section>
  );
}

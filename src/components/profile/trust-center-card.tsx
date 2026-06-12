"use client";

import Link from "next/link";
import {
  Check,
  ChevronRight,
  Circle,
  Clock,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  getNextStepMessage,
  getNextTrustStep,
  getTrustProgressItems,
  getTrustStatusChip,
  trustProgressPercent,
  type TrustItemStatus,
  type TrustProgressItem,
} from "@/lib/verification/trust-center";
import { yikeVerificationWhatsAppLink } from "@/lib/agent-verification";

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

function ProgressRing({ percent }: { percent: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-black/5" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="text-gold transition-all duration-500"
      />
    </svg>
  );
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
        <Link href={item.href} prefetch className="text-xs font-semibold text-gold-dark">
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
}: {
  profile: Profile;
  verified: boolean;
  variant?: "summary" | "detail";
  className?: string;
}) {
  const chip = getTrustStatusChip(profile, verified);
  const items = getTrustProgressItems(profile, verified);
  const percent = trustProgressPercent(items);
  const next = getNextTrustStep(items);
  const nextMessage = getNextStepMessage(profile, next);

  const listingItems = items.filter((i) => i.group === "listing_setup");
  const trustItems = items.filter((i) => i.group === "trust_upgrade");
  const listingIncomplete = listingItems.filter(
    (i) => i.status === "action_needed" || i.status === "under_review"
  );
  const completed = items.filter((i) => i.status === "complete");
  const allDone = listingIncomplete.length === 0;

  if (variant === "summary") {
    return (
      <section
        className={cn(
          "rounded-2xl border border-border bg-elevated px-4 py-3.5 shadow-float",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ProgressRing percent={percent} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-navy">
              {percent}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-navy">Account & verification</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", chipClasses(chip.tone))}>
                {chip.label}
              </span>
            </div>
            {nextMessage && !allDone ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{nextMessage}</p>
            ) : allDone ? (
              <p className="mt-0.5 text-xs text-muted">All required steps complete.</p>
            ) : null}
          </div>
        </div>
        <Link
          href={SETUP_HREF}
          prefetch
          className="pressable mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-navy"
        >
          <ShieldCheck className="h-4 w-4" />
          {allDone ? "View account setup" : "Continue setup"}
        </Link>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-elevated shadow-float",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <div className="relative">
          <ProgressRing percent={percent} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-navy">
            {percent}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-navy">Account & verification</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", chipClasses(chip.tone))}>
              {chip.label}
            </span>
          </div>
          {nextMessage && !allDone ? (
            <p className="mt-0.5 text-xs text-muted">{nextMessage}</p>
          ) : allDone ? (
            <p className="mt-0.5 text-xs text-muted">All required steps complete.</p>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-3">
        {listingItems.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              Required to list
            </p>
            <ul className="mt-2 space-y-2">
              {listingItems.map((item) => (
                <TrustRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ) : null}

        {trustItems.length > 0 ? (
          <div className={cn(listingItems.length > 0 && "mt-4")}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              Optional upgrades
            </p>
            <p className="mt-0.5 text-xs text-muted">Verified badge and company checks.</p>
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

        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2">
          <p className="text-xs text-muted">Need help?</p>
          <Link
            href={yikeVerificationWhatsAppLink("Hi Yike, I need help with my account setup.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-navy"
          >
            <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
            Chat support
            <ChevronRight className="h-3 w-3 text-muted" />
          </Link>
        </div>
      </div>
    </section>
  );
}

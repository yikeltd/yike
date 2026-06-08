"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ChevronDown,
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
import { OptionalWhatsAppInline } from "@/components/profile/optional-whatsapp-inline";

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
        <Link href={item.href} className="text-xs font-semibold text-gold-dark">
          Continue
        </Link>
      ) : null}
    </li>
  );
}

export function TrustCenterCard({
  profile,
  verified,
  defaultExpanded = false,
}: {
  profile: Profile;
  verified: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const chip = getTrustStatusChip(profile, verified);
  const items = getTrustProgressItems(profile, verified);
  const percent = trustProgressPercent(items);
  const next = getNextTrustStep(items);
  const nextMessage = getNextStepMessage(profile, next);

  const incomplete = items.filter(
    (i) => i.status === "action_needed" || i.status === "under_review"
  );
  const completed = items.filter((i) => i.status === "complete");
  const optional = items.filter((i) => i.status === "optional");

  const allDone = incomplete.length === 0;

  return (
    <section className="rounded-2xl border border-border bg-elevated shadow-float">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="pressable flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={expanded}
      >
        <div className="relative">
          <ProgressRing percent={percent} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-navy">
            {percent}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-navy">Trust & Verification</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", chipClasses(chip.tone))}>
              {chip.label}
            </span>
          </div>
          {nextMessage && !allDone ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{nextMessage}</p>
          ) : allDone ? (
            <p className="mt-0.5 text-xs text-muted">Your trust profile is up to date.</p>
          ) : null}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded ? (
        <div className="border-t border-border px-4 py-3">
          {incomplete.length > 0 ? (
            <ul className="space-y-2">
              {incomplete.map((item) => (
                <TrustRow key={item.id} item={item} />
              ))}
            </ul>
          ) : null}

          {completed.length > 0 ? (
            <details className={cn(incomplete.length > 0 && "mt-3")}>
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

          {optional.length > 0 ? (
            <ul className={cn("space-y-1.5", (incomplete.length > 0 || completed.length > 0) && "mt-3")}>
              {optional.map((item) => (
                <TrustRow key={item.id} item={item} />
              ))}
            </ul>
          ) : null}

          {next?.id === "whatsapp" && next.status === "action_needed" ? (
            <OptionalWhatsAppInline
              userId={profile.id}
              phone={profile.phone}
              whatsapp={profile.whatsapp}
              phoneVerified={profile.phone_verified}
            />
          ) : null}

          {next && next.status === "action_needed" && next.href && next.id !== "whatsapp" ? (
            <Link
              href={next.href}
              className="pressable mt-3 flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-navy"
            >
              <ShieldCheck className="h-4 w-4" />
              Continue verification
            </Link>
          ) : next?.status === "under_review" ? (
            <Link
              href="/agent/verification"
              className="pressable mt-3 flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-navy"
            >
              <BadgeCheck className="h-4 w-4 text-gold-dark" />
              View status
            </Link>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2">
            <p className="text-xs text-muted">Need help?</p>
            <Link
              href={yikeVerificationWhatsAppLink("Hi Yike, I need help with my account verification.")}
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
      ) : null}
    </section>
  );
}

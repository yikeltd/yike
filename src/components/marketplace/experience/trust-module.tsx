"use client";

import Link from "next/link";
import { Lock, ChevronDown } from "lucide-react";
import { TrustBadge, type TrustBadgeKind } from "./trust-badge";
import { cn } from "@/lib/utils";

const LEARN_MORE_BULLETS = [
  "Inspect vehicles and properties in person before payment.",
  "Never pay fully upfront to strangers or unverified accounts.",
  "Listing photos on Yike are watermarked and fingerprinted when media protection runs.",
  "Review the seller profile and use Report if anything feels wrong.",
] as const;

/**
 * Compact trust strip — reassures without dominating (₦50M purchase mindset).
 */
export function TrustModule({
  kinds,
  className,
  learnMoreHref = "/safety",
  showSecureMarketplace = true,
}: {
  kinds: TrustBadgeKind[];
  className?: string;
  learnMoreHref?: string;
  showSecureMarketplace?: boolean;
}) {
  const unique = [...new Set(kinds)];

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {unique.map((kind) => (
          <TrustBadge key={kind} kind={kind} size="sm" />
        ))}
        {showSecureMarketplace ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2 py-0.5 text-[9px] font-bold text-navy/70 ring-1 ring-navy/10">
            <Lock className="h-3 w-3 text-navy/50" aria-hidden />
            Secure Marketplace
          </span>
        ) : null}
      </div>

      <details className="group mt-2">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] font-semibold text-navy/45 transition hover:text-navy [&::-webkit-details-marker]:hidden">
          Learn more
          <ChevronDown
            className="h-3 w-3 transition group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="mt-2 space-y-1.5 rounded-xl border border-navy/8 bg-navy/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-navy/60">
          {LEARN_MORE_BULLETS.map((line) => (
            <li key={line}>· {line}</li>
          ))}
          <li>
            <Link
              href={learnMoreHref}
              className="font-bold text-navy underline-offset-2 hover:underline"
            >
              Open Safety Centre →
            </Link>
          </li>
        </ul>
      </details>
    </div>
  );
}

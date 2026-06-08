"use client";

import Link from "next/link";
import type { Profile } from "@/types/database";
import { listingVerificationJourney } from "@/lib/profile-display";
import { cn } from "@/lib/utils";

export function ProfileVerificationJourney({
  profile,
  verified,
}: {
  profile: Profile;
  verified: boolean;
}) {
  const steps = listingVerificationJourney(profile, verified);
  if (steps.length === 0) return null;

  return (
    <section className="rounded-2xl border border-navy/10 bg-elevated p-4 shadow-float">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        Listing account status
      </p>
      <ol className="mt-3 flex flex-wrap gap-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold",
              step.done
                ? "bg-gold/20 text-navy"
                : step.current
                  ? "bg-navy text-white"
                  : "bg-surface text-muted"
            )}
          >
            {step.label}
            {step.done ? " ✓" : ""}
          </li>
        ))}
      </ol>
      <Link
        href="/agent/verification"
        className="mt-3 inline-block text-xs font-semibold text-gold-dark"
      >
        {verified ? "Manage verification →" : "Get verified badge →"}
      </Link>
    </section>
  );
}

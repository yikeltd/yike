"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";

type SetupRow = {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
  action?: { label: string; href: string };
};

function RowIcon({ done }: { done: boolean }) {
  return done ? (
    <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
  ) : (
    <Circle className="h-4 w-4 text-muted" />
  );
}

export function ListingSetupCard({
  profile,
}: {
  profile: Profile;
  onVerified?: () => void;
}) {
  const rows: SetupRow[] = [
    {
      id: "email",
      label: "Email verified",
      done: Boolean(profile.email_verified),
      action: profile.email_verified
        ? undefined
        : { label: "Verify email", href: "/auth/verify-email" },
    },
    {
      id: "profile",
      label: "Personal details",
      detail: "Name, address, and date of birth",
      done: hasBasicListingProfile(profile),
      action: hasBasicListingProfile(profile)
        ? undefined
        : { label: "Complete profile", href: "/agent/profile-setup" },
    },
  ];

  const doneCount = rows.filter((r) => r.done).length;
  const allDone = doneCount === rows.length;

  return (
    <section className="rounded-2xl border border-border bg-elevated shadow-float">
      <div className="border-b border-border px-4 py-3.5">
        <p className="text-sm font-bold text-navy">Listing setup</p>
        <p className="mt-0.5 text-xs text-muted">
          {allDone
            ? "You can post listings on Yike."
            : "Complete these steps to post properties."}
        </p>
      </div>

      <ul className="divide-y divide-border px-4">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start gap-3 py-3">
            <span className="mt-0.5">
              <RowIcon done={row.done} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  row.done ? "text-muted line-through decoration-muted/40" : "text-navy"
                )}
              >
                {row.label}
              </p>
              {row.detail ? (
                <p className="mt-0.5 text-xs text-muted">{row.detail}</p>
              ) : null}
            </div>
            {!row.done && row.action ? (
              <Link
                href={row.action.href}
                className="shrink-0 text-xs font-bold text-gold-dark hover:underline"
              >
                {row.action.label}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

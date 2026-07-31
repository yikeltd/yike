"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { ApiVersionBadge } from "./versioning/api-version-badge";
import { History, Sparkles, AlertTriangle } from "lucide-react";
import type { ChangelogEntry } from "@/types/api-versioning";

export function ApiChangelogExperience() {
  const changelog: ChangelogEntry[] = [
    {
      version: "v1.2.0",
      date: "Jul 28, 2026",
      title: "Commercial Billing, Merchant Subscriptions & Boost APIs",
      features: [
        "Added POST /api/v1/payments/checkout for unified multi-provider checkout.",
        "Added GET /api/v1/subscriptions/plans for merchant subscription tiers.",
        "Added POST /api/v1/seller/boost for listing promotion activation.",
        "Added GET /api/v1/account/billing for 7.5% VAT invoice history.",
      ],
      migrationNotes: "Fully backward compatible with v1.1.0.",
    },
    {
      version: "v1.1.0",
      date: "Jul 15, 2026",
      title: "Marketplace Intelligence & Real-Time Webhooks",
      features: [
        "Added GET /api/v1/notifications for buyer and seller notification feeds.",
        "Added webhook event topics: listing.created, escrow.milestone_funded, trust.score_updated.",
        "Added AI Lead Quality scoring payload attributes (Hot / Warm / Cold).",
      ],
      migrationNotes: "Fully backward compatible with v1.0.0.",
    },
    {
      version: "v1.0.0",
      date: "Jun 1, 2026",
      title: "Initial GA Release — Marketplace, Escrow & Trust Passports",
      features: [
        "GA Release for Property & Vehicle Listings APIs.",
        "Escrow Milestone workspace management APIs.",
        "Public Trust Passport & score breakdown endpoints.",
        "Universal Search & location intelligence APIs.",
      ],
      breakingChanges: [
        "Deprecated legacy v0.9 path parameters. Replaced with bearer token auth header.",
      ],
      migrationNotes: "First GA release for Yike Developer Platform.",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <History className="h-6 w-6 text-gold" />
                API Release History & Changelog
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Detailed release notes, feature additions, breaking change logs, and migration instructions.
              </p>
            </div>
          </div>
        </div>

        {/* CHANGELOG LIST */}
        <div className="space-y-6">
          {changelog.map((entry, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-navy dark:text-gold">{entry.version}</span>
                  <ApiVersionBadge status={idx === 0 ? "stable" : "ga"} />
                </div>

                <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50">{entry.date}</span>
              </div>

              <div>
                <h2 className="text-sm font-black text-navy dark:text-white">{entry.title}</h2>
              </div>

              {/* FEATURES */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  New Features & API Additions
                </h3>
                <ul className="space-y-1 pl-4 list-disc text-navy/80 dark:text-white/80 leading-relaxed font-medium">
                  {entry.features?.map((f: string, fIdx: number) => (
                    <li key={fIdx}>{f}</li>
                  ))}
                </ul>
              </div>

              {/* BREAKING CHANGES */}
              {entry.breakingChanges && entry.breakingChanges.length > 0 && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-300 space-y-1">
                  <h3 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Breaking Changes
                  </h3>
                  <ul className="space-y-1 pl-4 list-disc leading-relaxed font-semibold">
                    {entry.breakingChanges.map((b: string, bIdx: number) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* MIGRATION NOTES */}
              {entry.migrationNotes && (
                <div className="pt-2 text-[10px] font-bold text-navy/60 dark:text-white/60">
                  Note: {entry.migrationNotes}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

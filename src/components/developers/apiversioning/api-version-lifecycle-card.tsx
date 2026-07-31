"use client";

import type { ApiVersion } from "@/types/api-versioning";
import { GitBranch, ShieldCheck, Sparkles } from "lucide-react";

export function ApiVersionLifecycleCard() {
  const versions: ApiVersion[] = [
    {
      id: "v1",
      versionNumber: "v1.0 (Production Current)",
      releaseDate: "2026-07-01",
      status: "active",
      breakingChangesCount: 0,
      activeIntegrations: 1420,
      description: "Stable REST & Webhook endpoints powering property search, trust passport, escrow, and seller CRM.",
    },
    {
      id: "v2",
      versionNumber: "v2.0-beta (Developer Preview)",
      releaseDate: "2026-08-15",
      status: "beta",
      breakingChangesCount: 2,
      activeIntegrations: 85,
      description: "Developer preview featuring GraphQL endpoint, 1536d vector search API, and real-time WebSocket subscriptions.",
    },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs select-none">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-emerald-500" />
            API Release Lifecycle & Version Management
          </h2>
          <p className="text-[11px] text-navy/60 dark:text-white/60 mt-0.5">
            Active production releases, LTS support guarantees, and developer preview versions.
          </p>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
          V1.0 ACTIVE (LTS SUPPORT UNTIL 2028)
        </span>
      </div>

      {/* VERSIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {versions.map((ver) => (
          <div
            key={ver.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-navy dark:text-white flex items-center gap-1.5">
                  {ver.status === "active" ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-gold" />
                  )}
                  {ver.versionNumber}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase font-mono ${
                    ver.status === "active"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-gold/20 text-gold"
                  }`}
                >
                  {ver.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-navy/70 dark:text-white/70">{ver.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between font-mono text-[10px]">
              <span>Released: {ver.releaseDate}</span>
              <span className="font-bold text-navy dark:text-white">{ver.activeIntegrations.toLocaleString()} Integrations</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

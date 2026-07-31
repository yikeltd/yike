"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { ApiVersionBadge } from "./versioning/api-version-badge";
import { DeprecationNotice } from "./versioning/deprecation-notice";
import { ApiCompatibilityMatrix } from "./versioning/api-compatibility-matrix";
import { GitBranch, ShieldCheck, Clock, BookOpen } from "lucide-react";
import type { SdkCompatibility } from "@/types/api-versioning";

export function ApiVersionCenterExperience() {
  const versions = [
    {
      version: "v1.2",
      status: "stable" as const,
      releaseDate: "Jul 2026",
      description: "Current stable production release with Billing, Payments, Escrow, Trust Passports, and Marketplace APIs.",
      isCurrent: true,
    },
    {
      version: "v2.0-preview",
      status: "preview" as const,
      releaseDate: "Q3 2026 (Preview)",
      description: "Upcoming version with GraphQL support, event-driven webhooks v2, and fine-grained OAuth 2.0 scopes.",
      isCurrent: false,
    },
    {
      version: "v0.9-legacy",
      status: "deprecated" as const,
      releaseDate: "Jan 2026",
      sunsetDate: "Dec 31, 2026",
      description: "Legacy beta REST endpoints. Scheduled for full sunset on Dec 31, 2026.",
      isCurrent: false,
    },
  ];

  const sdkMatrix: SdkCompatibility[] = [
    { sdkName: "@yike/node-sdk", sdkVersion: "v1.2.4", supportedApiVersion: "v1.2", minVersion: "v1.0", latestVersion: "v1.2.4", status: "stable" },
    { sdkName: "yike-python-sdk", sdkVersion: "v1.2.0", supportedApiVersion: "v1.2", minVersion: "v1.0", latestVersion: "v1.2.0", status: "stable" },
    { sdkName: "@yike/react-hooks", sdkVersion: "v2.0.0-beta", supportedApiVersion: "v2.0-preview", minVersion: "v1.2", latestVersion: "v2.0.0-beta", status: "preview" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <GitBranch className="h-6 w-6 text-gold" />
                API Version Center & Lifecycle Management
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Formal release timelines, deprecation policies, sunset windows, and SDK compatibility matrices.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-navy/70 dark:text-white/70">Current Stable API:</span>
              <ApiVersionBadge status="stable" className="!text-xs py-1" />
            </div>
          </div>
        </div>

        {/* ACTIVE DEPRECATION WARNING BANNER */}
        <DeprecationNotice
          title="Legacy API v0.9 Deprecation Schedule"
          description="Endpoints under /api/v0.9/ have been officially deprecated. Developers should migrate to /api/v1/ before Dec 31, 2026 to prevent request disruptions."
          deprecatedSince="Jul 1, 2026"
          removalDate="Dec 31, 2026"
          replacementApi="GET /api/v1/listings"
          migrationLink="/developers/migrations"
          severity="warning"
        />

        {/* VERSION RELEASE TIMELINE */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gold" />
            API Release & Version Lifecycle Status
          </h2>

          <div className="space-y-3">
            {versions.map((ver, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all space-y-2 ${
                  ver.isCurrent
                    ? "bg-amber-500/10 dark:bg-gold/10 border-gold shadow-md"
                    : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-navy dark:text-white">{ver.version}</span>
                    <ApiVersionBadge status={ver.status} />
                    {ver.isCurrent && (
                      <span className="rounded-full bg-gold text-navy px-2.5 py-0.5 text-[9px] font-black uppercase">
                        Current Production
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-semibold text-navy/50 dark:text-white/50">
                    Released: {ver.releaseDate} {ver.sunsetDate ? `· Sunset: ${ver.sunsetDate}` : ""}
                  </span>
                </div>

                <p className="text-[11px] text-navy/70 dark:text-white/70">{ver.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* VERSION POLICY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-2">
            <h3 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Semantic Versioning & Compatibility Guarantee
            </h3>
            <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">
              Yike API follows strict SemVer principles (Major.Minor.Patch). Non-breaking additive changes (new fields, new optional query parameters) are released under Minor versions without breaking existing code.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-2">
            <h3 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-purple-600" />
              Deprecation & 6-Month Sunset Policy
            </h3>
            <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">
              When an API version is deprecated, Yike maintains a minimum 6-month migration window before final sunset. Deprecated endpoints return a <code className="font-mono bg-black/10 px-1 rounded text-gold">Deprecation: true</code> response header.
            </p>
          </div>
        </div>

        {/* SDK COMPATIBILITY MATRIX */}
        <ApiCompatibilityMatrix matrix={sdkMatrix} />

      </div>
    </div>
  );
}

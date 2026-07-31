"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import type { MigrationGuide } from "@/types/api-versioning";

export function ApiMigrationGuidesExperience() {
  const guide: MigrationGuide = {
    fromVersion: "v1.2",
    toVersion: "v2.0-preview",
    summary: "Migration guide for upgrading applications from API v1.2 to v2.0. Introduces unified response envelope, camelCase JSON attributes, and OAuth2 scopes.",
    endpoints: [
      {
        oldEndpoint: "/api/v1/properties/search?loc=Lekki",
        newEndpoint: "/api/v2/listings/search?location=Lekki&vertical=property",
        method: "GET",
        parameterChanges: [
          "Query param 'loc' renamed to 'location'.",
          "Explicit 'vertical' param required ('property' | 'vehicle').",
        ],
        responseDiff: "Response wrapped in standard data envelope: { data: [...], meta: { page: 1, total: 42 } }",
        exampleRequestOld: `GET /api/v1/properties/search?loc=Lekki\nAuthorization: Bearer yike_live_...`,
        exampleRequestNew: `GET /api/v2/listings/search?location=Lekki&vertical=property\nAuthorization: Bearer yike_live_...`,
        exampleResponseOld: `[\n  { "id": "P_101", "title": "5 Bed Duplex", "price_ngn": 350000000 }\n]`,
        exampleResponseNew: `{\n  "data": [\n    { "id": "P_101", "title": "5 Bed Duplex", "price": 350000000, "category": "property" }\n  ],\n  "meta": { "total": 1, "page": 1 }\n}`,
      },
    ],
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="h-6 w-6 text-gold" />
                API Migration Guides
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Step-by-step documentation for migrating between API major versions with side-by-side code diffs.
              </p>
            </div>
          </div>
        </div>

        {/* GUIDE CARD */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-6 text-xs">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 font-black text-base text-navy dark:text-white">
                <span>Migration Guide:</span>
                <span className="font-mono text-gold">{guide.fromVersion}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-mono text-emerald-500">{guide.toVersion}</span>
              </div>
              <p className="text-[11px] text-navy/70 dark:text-white/70 mt-1 leading-relaxed">
                {guide.summary}
              </p>
            </div>
          </div>

          {/* ENDPOINT MIGRATION LIST */}
          {guide.endpoints.map((ep, idx) => (
            <div key={idx} className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold">
                  <span className="text-rose-600 dark:text-rose-400 line-through">{ep.oldEndpoint}</span>
                  <ArrowRight className="h-4 w-4 text-navy/40 dark:text-white/40 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">{ep.newEndpoint}</span>
                </div>

                <div className="space-y-1 pt-2">
                  <h4 className="font-black uppercase tracking-wider text-[10px] text-navy/60 dark:text-white/60">Parameter & Schema Changes:</h4>
                  <ul className="list-disc pl-4 space-y-0.5 text-navy/80 dark:text-white/80 font-medium">
                    {ep.parameterChanges.map((c, cIdx) => (
                      <li key={cIdx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* SIDE BY SIDE REQUEST & RESPONSE CODE DIFF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#031B4E] text-white border border-white/10 space-y-2">
                  <span className="text-[10px] font-black uppercase text-rose-400 block">Old Response Format ({guide.fromVersion})</span>
                  <pre className="p-3 rounded-xl bg-black/50 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <code>{ep.exampleResponseOld}</code>
                  </pre>
                </div>

                <div className="p-4 rounded-2xl bg-[#031B4E] text-white border border-white/10 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-400 block">New Response Format ({guide.toVersion})</span>
                  <pre className="p-3 rounded-xl bg-black/50 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                    <code>{ep.exampleResponseNew}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}

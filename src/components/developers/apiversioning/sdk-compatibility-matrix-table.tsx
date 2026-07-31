"use client";

import type { SdkCompatibility } from "@/types/api-versioning";
import { Code2, CheckCircle2 } from "lucide-react";

export function SdkCompatibilityMatrixTable() {
  const sdks: SdkCompatibility[] = [
    { sdkName: "@yike/sdk-node", language: "TypeScript / Node.js", latestVersion: "v1.4.2", supportedApiVersions: ["v1.0", "v2.0-beta"], status: "compatible" },
    { sdkName: "yike-python-sdk", language: "Python 3.10+", latestVersion: "v1.2.0", supportedApiVersions: ["v1.0"], status: "compatible" },
    { sdkName: "yike/php-sdk", language: "PHP 8.2+ / Laravel", latestVersion: "v1.1.0", supportedApiVersions: ["v1.0"], status: "compatible" },
    { sdkName: "github.com/yikeltd/yike-go", language: "Go 1.22+", latestVersion: "v1.0.4", supportedApiVersions: ["v1.0"], status: "compatible" },
    { sdkName: "com.yike.sdk", language: "Java / Kotlin", latestVersion: "v1.0.1", supportedApiVersions: ["v1.0"], status: "compatible" },
  ];

  return (
    <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-purple-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
            Official SDK Compatibility Matrix & Backward Compatibility Audit
          </h3>
        </div>

        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase font-mono">
          5 / 5 SDKs FULLY COMPATIBLE WITH V1.0
        </span>
      </div>

      <div className="space-y-3 font-mono text-[11px]">
        {sdks.map((sdk) => (
          <div
            key={sdk.sdkName}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-navy dark:text-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>{sdk.sdkName}</span>
                <span className="text-[10px] text-navy/50 dark:text-white/50 font-normal">({sdk.language})</span>
              </div>
              <p className="text-[10px] text-navy/60 dark:text-white/60">
                Latest SDK Version: {sdk.latestVersion} · Supported APIs: {sdk.supportedApiVersions?.join(", ")}
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 font-black uppercase text-[9px] shrink-0">
              {sdk.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

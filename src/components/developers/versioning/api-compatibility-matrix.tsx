"use client";

import type { SdkCompatibility } from "@/types/api-versioning";
import { ApiVersionBadge } from "./api-version-badge";
import { cn } from "@/lib/utils";

export function ApiCompatibilityMatrix({
  matrix,
  className,
}: {
  matrix: SdkCompatibility[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl text-xs select-none space-y-3", className)}>
      <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white">
        Official SDK & API Version Compatibility Matrix
      </h3>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
            <th className="py-2.5 px-3">SDK Library</th>
            <th className="py-2.5 px-3">SDK Version</th>
            <th className="py-2.5 px-3">Supported API Version</th>
            <th className="py-2.5 px-3">Min Version</th>
            <th className="py-2.5 px-3">Latest Version</th>
            <th className="py-2.5 px-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-navy dark:text-white">
          {matrix.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              <td className="py-3 px-3 font-black text-navy dark:text-gold">{row.sdkName}</td>
              <td className="py-3 px-3 font-mono text-[11px]">{row.sdkVersion}</td>
              <td className="py-3 px-3 font-bold">{row.supportedApiVersion}</td>
              <td className="py-3 px-3 font-mono text-[11px] text-navy/60 dark:text-white/60">{row.minVersion}</td>
              <td className="py-3 px-3 font-mono text-[11px]">{row.latestVersion}</td>
              <td className="py-3 px-3 text-right">
                <ApiVersionBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

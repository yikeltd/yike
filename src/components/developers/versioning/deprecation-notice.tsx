"use client";

import Link from "next/link";
import { AlertTriangle, Info, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeprecationNotice({
  title,
  description,
  deprecatedSince,
  removalDate,
  replacementApi,
  migrationLink,
  severity = "warning",
  className,
}: {
  title: string;
  description: string;
  deprecatedSince: string;
  removalDate: string;
  replacementApi?: string;
  migrationLink?: string;
  severity?: "warning" | "danger" | "info";
  className?: string;
}) {
  const isDanger = severity === "danger";
  const isInfo = severity === "info";

  return (
    <div
      className={cn(
        "rounded-3xl border p-5 shadow-lg space-y-3 text-xs select-none",
        isDanger
          ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
          : isInfo
          ? "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200"
          : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 font-black text-sm">
          {isInfo ? (
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          ) : (
            <AlertTriangle className={cn("h-5 w-5 shrink-0", isDanger ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400")} />
          )}
          <h3>{title}</h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase shrink-0">
          <span>Deprecated: {deprecatedSince}</span>
          <span>·</span>
          <span>Removal: {removalDate}</span>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed opacity-90">{description}</p>

      {(replacementApi || migrationLink) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-current/15 text-[11px] font-bold">
          {replacementApi && (
            <span>
              Replacement API: <code className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-gold">{replacementApi}</code>
            </span>
          )}

          {migrationLink && (
            <Link
              href={migrationLink}
              className="flex items-center gap-1 font-black underline hover:opacity-80"
            >
              <span>View Migration Guide</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import type { ApiVersionStatus } from "@/types/api-versioning";
import { cn } from "@/lib/utils";

export function ApiVersionBadge({
  status,
  className,
}: {
  status: ApiVersionStatus;
  className?: string;
}) {
  const styles: Record<ApiVersionStatus, { bg: string; text: string; label: string }> = {
    stable: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", label: "Stable" },
    ga: { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", label: "GA" },
    preview: { bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-600 dark:text-amber-400", label: "Preview" },
    beta: { bg: "bg-blue-500/10 border-blue-500/30", text: "text-blue-600 dark:text-blue-400", label: "Beta" },
    experimental: { bg: "bg-purple-500/10 border-purple-500/30", text: "text-purple-600 dark:text-purple-400", label: "Experimental" },
    deprecated: { bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-600 dark:text-rose-400", label: "Deprecated" },
    sunset: { bg: "bg-slate-500/10 border-slate-500/30", text: "text-slate-600 dark:text-slate-400", label: "Sunset" },
    internal: { bg: "bg-gray-500/10 border-gray-500/30", text: "text-gray-600 dark:text-gray-400", label: "Internal" },
  };

  const style = styles[status] || styles.stable;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}

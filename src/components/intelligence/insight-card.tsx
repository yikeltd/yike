"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, AlertCircle, Info, ShieldAlert } from "lucide-react";
import type { PlatformInsight } from "@/lib/intelligence/types";
import { trackTransactionEvent } from "@/lib/analytics/index";

interface Props {
  insight: PlatformInsight;
  className?: string;
  onActionClick?: () => void;
}

export function InsightCard({ insight, className = "", onActionClick }: Props) {
  const priorityColors = {
    critical: "bg-red-500/10 text-red-700 border-red-500/20",
    high: "bg-amber-500/10 text-amber-800 border-amber-500/20",
    medium: "bg-blue-500/10 text-blue-800 border-blue-500/20",
    low: "bg-navy/5 text-navy/70 border-navy/10",
  };

  const priorityIcons = {
    critical: ShieldAlert,
    high: AlertCircle,
    medium: Sparkles,
    low: Info,
  };

  const PriorityIcon = priorityIcons[insight.priority];

  const handleTrackClick = () => {
    trackTransactionEvent("crm_insight_clicked", {
      metadata: { insightId: insight.id, category: insight.category, priority: insight.priority },
    });
    if (onActionClick) onActionClick();
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl border border-navy/10 bg-white p-5 shadow-xs transition-all hover:shadow-md sm:p-6 ${className}`}
    >
      <div>
        {/* Top Header & Priority Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy/50">
              {insight.sourcePlatform}
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityColors[insight.priority]}`}
          >
            <PriorityIcon className="h-3 w-3" />
            {insight.priority}
          </span>
        </div>

        {/* Title & Recommendation Body */}
        <h4 className="mt-3 text-sm font-bold text-navy group-hover:text-gold-dark sm:text-base">
          {insight.title}
        </h4>
        <p className="mt-1 text-xs font-semibold text-navy/80">{insight.recommendation}</p>

        {/* Reason Context */}
        <p className="mt-2 text-xs text-navy/60 leading-relaxed">{insight.reason}</p>
      </div>

      {/* Action Link Button */}
      {insight.action && (
        <div className="mt-4 pt-3 border-t border-navy/5">
          <Link
            href={insight.action.href}
            onClick={handleTrackClick}
            className="pressable inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold-dark"
          >
            <span>{insight.action.label}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

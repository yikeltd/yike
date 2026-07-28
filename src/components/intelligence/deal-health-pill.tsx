"use client";

import React from "react";
import { TrendingUp, Activity, AlertTriangle } from "lucide-react";
import type { DealMomentum } from "@/lib/intelligence/types";

interface Props {
  healthScore: number;
  probabilityOfClosing: number;
  momentum: DealMomentum;
}

export function DealHealthPill({ healthScore, probabilityOfClosing, momentum }: Props) {
  const momentumStyles = {
    accelerating: { label: "Accelerating", color: "bg-emerald-500/10 text-emerald-800 border-emerald-500/20", icon: TrendingUp },
    stable: { label: "Stable Momentum", color: "bg-blue-500/10 text-blue-800 border-blue-500/20", icon: Activity },
    stalled: { label: "Stalled", color: "bg-amber-500/10 text-amber-800 border-amber-500/20", icon: AlertTriangle },
    at_risk: { label: "At Risk", color: "bg-red-500/10 text-red-800 border-red-500/20", icon: AlertTriangle },
  };

  const style = momentumStyles[momentum];
  const Icon = style.icon;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full border border-navy/10 bg-navy/5 px-3 py-1 text-xs font-bold text-navy">
        <span>Deal Health: {healthScore}/100</span>
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-navy">
        <span>{probabilityOfClosing}% Win Prob</span>
      </div>

      <div className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${style.color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{style.label}</span>
      </div>
    </div>
  );
}

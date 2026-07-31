"use client";

import { Sparkles, TrendingUp, ShieldCheck, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function BusinessInsightsPanel({
  className,
}: {
  className?: string;
}) {
  const insights = [
    { title: "High Demand Area Alert", desc: "Properties in Lekki Phase 1 under ₦300m receive 40% higher inquiry rate this month.", icon: TrendingUp },
    { title: "Hot Buyer Lead Detected", desc: "Dr. Alabi K. has viewed 4 duplex listings in Lekki in the last 2 hours.", icon: Flame },
    { title: "Trust Score Boost Opportunity", desc: "Complete 1 additional physical field inspection to reach Gold Merchant Status.", icon: ShieldCheck },
  ];

  return (
    <div className={cn("rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4 text-xs select-none", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-gold" />
          Yike AI Business Insights
        </h3>
        <span className="rounded-full bg-gold/20 text-navy dark:text-gold px-2.5 py-0.5 text-[10px] font-black">
          Real-Time Intelligence
        </span>
      </div>

      <div className="space-y-2.5">
        {insights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-start gap-3"
            >
              <span className="p-2 rounded-xl bg-[#031B4E] text-gold shrink-0 mt-0.5">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-black text-navy dark:text-white">{item.title}</p>
                <p className="text-[11px] text-navy/70 dark:text-white/70 mt-0.5 leading-tight">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

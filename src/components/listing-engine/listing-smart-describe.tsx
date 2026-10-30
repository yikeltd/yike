"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  categoryLabel: string;
  className?: string;
};

export function ListingSmartDescribe({ value, onChange, categoryLabel, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-navy/[0.08] bg-gradient-to-br from-navy/[0.03] to-gold/[0.06] p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-gold">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy">Describe your {categoryLabel.toLowerCase()}</p>
          <p className="text-[11px] text-navy/55">Title, make, model, beds — we suggest fields you can edit.</p>
        </div>
      </div>
      <textarea
        id="le-smart-describe"
        rows={3}
        value={value}
        placeholder="e.g. 2019 Toyota Corolla automatic · or 3 bed flat for rent · or Samsung A54 128GB"
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
      />
    </div>
  );
}

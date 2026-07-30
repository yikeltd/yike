"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONBOARDING_CARD_GRID_CLASS } from "@/lib/onboarding/responsive-tokens";
import { OnboardingResponsiveImage } from "./onboarding-responsive-image";

export type OnboardingGridCardItem = {
  id: string;
  title: string;
  subtitle?: string;
  assetCategory: "cars" | "props";
  assetName: string;
  badge?: string;
};

type Props = {
  items: OnboardingGridCardItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
  renderExtra?: (item: OnboardingGridCardItem) => ReactNode;
};

/**
 * OnboardingCardGrid Component
 * Fluid adaptive grid system (2-col mobile, 3-col tablet, 4-col desktop).
 * Meets 48x48px min touch target, keyboard accessibility, and 60fps motion.
 */
export function OnboardingCardGrid({
  items,
  selectedId,
  onSelect,
  className,
  renderExtra,
}: Props) {
  return (
    <div className={cn(ONBOARDING_CARD_GRID_CLASS, className)}>
      {items.map((item, idx) => {
        const isSelected = selectedId === item.id;

        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${item.title}${item.subtitle ? `. ${item.subtitle}` : ""}`}
            onClick={() => onSelect(item.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item.id);
              }
            }}
            className={cn(
              "pressable group relative flex flex-col justify-between h-full min-h-[160px] min-w-[48px] rounded-3xl border-2 p-4 transition-all duration-200 cursor-pointer select-none",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E4B547]/50",
              isSelected
                ? "border-[#F59E0B] bg-[#FFFBEB] ring-4 ring-[#F59E0B]/15 shadow-md scale-[1.01]"
                : "border-slate-200/90 bg-white hover:border-[#E4B547]/60 hover:shadow-md"
            )}
          >
            {/* OPTIONAL BADGE */}
            {item.badge && (
              <span className="absolute top-3 left-3 z-10 rounded-full bg-[#031B4E] px-2.5 py-0.5 text-[10px] font-extrabold text-[#E4B547] shadow-xs">
                {item.badge}
              </span>
            )}

            {/* SELECTION CHECKMARK */}
            <div
              className={cn(
                "absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border transition-all shadow-xs",
                isSelected
                  ? "border-[#F59E0B] bg-[#F59E0B] text-[#031B4E] scale-100"
                  : "border-slate-300 bg-white/90 text-transparent group-hover:border-slate-400 opacity-60"
              )}
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
            </div>

            {/* RETINA WEBP IMAGE */}
            <OnboardingResponsiveImage
              category={item.assetCategory}
              assetName={item.assetName}
              alt={item.title}
              priority={idx < 4}
              className="mb-3 aspect-[16/11] bg-slate-50/50"
            />

            {/* CARD CONTENT */}
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-[#031B4E] leading-snug">
                {item.title}
              </h3>
              {item.subtitle && (
                <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-tight">
                  {item.subtitle}
                </p>
              )}
            </div>

            {renderExtra ? renderExtra(item) : null}
          </div>
        );
      })}
    </div>
  );
}

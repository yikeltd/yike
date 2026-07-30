"use client";

import type { ReactNode } from "react";
import { Sparkles, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_CONTAINER_CLASS,
  ONBOARDING_TYPOGRAPHY,
} from "@/lib/onboarding/responsive-tokens";

type Props = {
  stepIndex: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  canContinue?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  showNavigation?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * OnboardingLayoutContainer Component
 * Centered responsive container (max 1280px) enforcing 8px spacing,
 * fluid typography, top progress bar, and 48x48px min touch controls.
 */
export function OnboardingLayoutContainer({
  stepIndex,
  totalSteps,
  title,
  subtitle,
  onBack,
  onNext,
  canContinue = true,
  isSubmitting = false,
  nextLabel = "Continue",
  showNavigation = true,
  children,
  className,
}: Props) {
  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <main className={cn(ONBOARDING_CONTAINER_CLASS, className)}>
      {/* HEADER & PROGRESS INDICATOR */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E4B547]/40 bg-[#E4B547]/10 px-3.5 py-1 text-xs font-extrabold text-[#E4B547]">
          <Sparkles className="h-3.5 w-3.5 text-[#E4B547]" />
          <span>Seller Onboarding Engine</span>
        </div>

        <h1 className={ONBOARDING_TYPOGRAPHY.title}>{title}</h1>

        {subtitle && (
          <p className={ONBOARDING_TYPOGRAPHY.subtitle}>{subtitle}</p>
        )}

        {/* PROGRESS BAR */}
        <div className="pt-2 space-y-1.5 max-w-md mx-auto">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E4B547] via-amber-400 to-[#F59E0B] transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>
              Step {stepIndex + 1} of {totalSteps}
            </span>
            <span>{progressPercent}% Completed</span>
          </div>
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="w-full">{children}</div>

      {/* FOOTER NAVIGATION CONTROLS */}
      {showNavigation && (
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 max-w-4xl mx-auto">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={stepIndex === 0 || isSubmitting}
              className="pressable min-h-[48px] min-w-[48px] w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-xs md:text-sm font-bold text-[#031B4E] hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue || isSubmitting}
              className="pressable min-h-[48px] min-w-[48px] w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] px-8 py-3 text-xs md:text-sm font-black text-[#031B4E] shadow-md hover:bg-amber-400 active:scale-98 disabled:opacity-40 transition-all"
            >
              <span>{isSubmitting ? "Saving…" : nextLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      )}
    </main>
  );
}

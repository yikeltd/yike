import type { SubscriptionPlanCode } from "@/lib/subscriptions/constants";
import { PLAN_BADGE_LABELS } from "@/lib/subscriptions/constants";
import { cn } from "@/lib/utils";

export function SubscriptionPlanBadge({
  planCode,
  className,
  size = "sm",
}: {
  planCode: SubscriptionPlanCode | string | null | undefined;
  className?: string;
  size?: "sm" | "md";
}) {
  if (!planCode || planCode === "free") return null;
  if (planCode !== "pro_agent" && planCode !== "agency" && planCode !== "developer") {
    return null;
  }

  const label = PLAN_BADGE_LABELS[planCode];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-navy/10 bg-white/90 font-semibold text-navy shadow-sm",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {label}
    </span>
  );
}

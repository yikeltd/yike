import { YIKE_COINS_NON_CASH_NOTICE } from "@/lib/yike-coins/constants";
import { cn } from "@/lib/utils";

export function YikeCoinsNonCashNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "rounded-xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-amber-950",
        className,
      )}
      role="note"
    >
      {YIKE_COINS_NON_CASH_NOTICE}
    </p>
  );
}

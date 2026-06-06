import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewStats } from "@/types/database";
import { formatReviewSummary } from "@/lib/reviews/queries";

export function ReviewSummaryHeader({ stats }: { stats: ReviewStats }) {
  if (stats.total === 0) {
    return (
      <p className="text-sm text-muted">No reviews yet</p>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <p className="text-3xl font-black text-navy">{stats.average}</p>
        <div className="mt-1 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                "h-4 w-4",
                n <= Math.round(stats.average) ? "fill-gold text-gold" : "text-navy/15"
              )}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">{formatReviewSummary(stats)}</p>
      </div>
      <div className="min-w-[140px] flex-1 space-y-1">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = stats.breakdown[star];
          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-[10px]">
              <span className="w-3 text-muted">{star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-4 text-right text-muted">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

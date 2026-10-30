"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

type PreviewReview = {
  id: string;
  rating: number;
  body: string;
  created_at: string;
  reviewer?: { full_name: string | null; avatar_url: string | null } | null;
};

type PreviewPayload = {
  stats: { total: number; average: number };
  reviews: PreviewReview[];
};

function formatReviewDate(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  return then.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const iconClass = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            iconClass,
            i <= rating ? "fill-gold text-gold" : "text-navy/15 dark:text-white/15",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

function ReviewsHeader({
  total,
  showViewAll,
  reviewsHref,
  variant,
}: {
  total?: number;
  showViewAll: boolean;
  reviewsHref: string | null;
  variant: "default" | "listingDetail";
}) {
  const isDetail = variant === "listingDetail";
  return (
    <div className="flex items-center justify-between gap-3">
      <h4
        className={cn(
          "font-black text-navy dark:text-white",
          isDetail ? "text-lg sm:text-xl" : "text-sm",
        )}
      >
        Reviews &amp; feedback{" "}
        {typeof total === "number" && total > 0 ? (
          <span
            className={cn(
              "font-bold",
              isDetail ? "text-slate-500 dark:text-slate-400" : "text-navy/45 dark:text-white/45",
            )}
          >
            ({total})
          </span>
        ) : null}
      </h4>
      {showViewAll && reviewsHref ? (
        <Link
          href={reviewsHref}
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 font-bold text-navy/70 hover:text-navy dark:text-white/70 dark:hover:text-white",
            isDetail ? "text-sm" : "text-xs",
          )}
        >
          View all
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export function SellerContactReviewsPreview({
  sellerId,
  profileHref,
  className,
  showEmptyState = false,
  variant = "default",
}: {
  sellerId: string;
  profileHref: string;
  className?: string;
  showEmptyState?: boolean;
  variant?: "default" | "listingDetail";
}) {
  const [data, setData] = useState<PreviewPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isDetail = variant === "listingDetail";

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/reviews/agent/${encodeURIComponent(sellerId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((json: PreviewPayload) => {
        if (cancelled) return;
        setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ stats: { total: 0, average: 0 }, reviews: [] });
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  if (!loaded) {
    return isDetail ? (
      <div className={cn("space-y-4", className)} data-testid="seller-reviews-loading">
        <ReviewsHeader showViewAll={false} reviewsHref={null} variant={variant} />
        <p className="text-sm text-navy/45 dark:text-white/45">Loading reviews…</p>
      </div>
    ) : null;
  }

  const total = data?.stats.total ?? 0;
  const reviews = data?.reviews ?? [];
  const reviewsHref =
    profileHref?.startsWith("/agents/") ? `${profileHref}#reviews` : null;
  const showViewAll = Boolean(reviewsHref && total > 0);

  if (total === 0 || reviews.length === 0) {
    if (!showEmptyState) return null;
    return (
      <div className={cn("space-y-3", className)} data-testid="seller-reviews-empty">
        <ReviewsHeader showViewAll={false} reviewsHref={null} variant={variant} />
        <p className="text-sm font-medium leading-relaxed text-navy/55 dark:text-white/55">
          No published reviews for this seller yet.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} data-testid="seller-reviews-preview">
      <ReviewsHeader
        total={total}
        showViewAll={showViewAll}
        reviewsHref={reviewsHref}
        variant={variant}
      />

      <div
        className={cn(
          isDetail
            ? "flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
            : "flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {reviews.slice(0, 3).map((review) => {
          const name = review.reviewer?.full_name?.trim() || "Buyer";
          const body = review.body.trim();
          return (
            <article
              key={review.id}
              className={cn(
                "snap-start border border-slate-200/90 bg-white dark:border-white/10 dark:bg-white/[0.03]",
                isDetail
                  ? "min-w-[85%] shrink-0 rounded-2xl p-4 shadow-[0_2px_12px_-6px_rgba(3,27,78,0.12)] sm:min-w-[72%] md:min-w-0 md:shrink"
                  : "min-w-[210px] max-w-[240px] shrink-0 rounded-2xl border-navy/8 bg-slate-50/80 p-3.5 shadow-sm dark:bg-white/[0.04]",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-navy/20",
                    isDetail ? "h-11 w-11" : "h-9 w-9",
                  )}
                >
                  {review.reviewer?.avatar_url ? (
                    <Image
                      src={review.reviewer.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="m-auto h-5 w-5 text-navy/40" aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate font-bold text-navy dark:text-white",
                      isDetail ? "text-sm" : "text-xs",
                    )}
                  >
                    {name}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-white/50">
                    {formatReviewDate(review.created_at)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Stars rating={review.rating} size={isDetail ? "lg" : "sm"} />
              </div>
              <p
                className={cn(
                  "mt-2.5 leading-relaxed text-navy/80 dark:text-white/80",
                  isDetail ? "text-sm line-clamp-5" : "text-[11px] leading-snug",
                )}
              >
                {body}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

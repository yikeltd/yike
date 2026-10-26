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

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= rating ? "fill-gold text-gold" : "text-navy/15 dark:text-white/15",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function SellerContactReviewsPreview({
  sellerId,
  profileHref,
  className,
  showEmptyState = false,
}: {
  sellerId: string;
  profileHref: string;
  className?: string;
  /** When true, show honest empty copy after load if there are no reviews. */
  showEmptyState?: boolean;
}) {
  const [data, setData] = useState<PreviewPayload | null>(null);
  const [loaded, setLoaded] = useState(false);

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
    return null;
  }

  const total = data?.stats.total ?? 0;
  const reviews = data?.reviews ?? [];
  const reviewsHref =
    profileHref?.startsWith("/agents/") ? `${profileHref}#reviews` : null;
  const showViewAll = Boolean(reviewsHref && total > reviews.length);

  if (total === 0 || reviews.length === 0) {
    if (!showEmptyState) return null;
    return (
      <div
        className={cn(
          "space-y-2 border-t border-navy/10 pt-5 dark:border-white/10",
          className,
        )}
        data-testid="seller-reviews-empty"
      >
        <h4 className="text-sm font-black text-navy dark:text-white">
          Reviews &amp; feedback
        </h4>
        <p className="text-xs font-medium leading-relaxed text-navy/55 dark:text-white/55">
          No published reviews for this seller yet.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-3.5 border-t border-navy/10 pt-5 dark:border-white/10",
        className,
      )}
      data-testid="seller-reviews-preview"
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-black text-navy dark:text-white">
          Reviews &amp; feedback{" "}
          <span className="font-bold text-navy/45 dark:text-white/45">({total})</span>
        </h4>
        {showViewAll ? (
          <Link
            href={reviewsHref!}
            className="inline-flex items-center gap-0.5 text-xs font-bold text-navy/70 hover:text-navy dark:text-white/70 dark:hover:text-white"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {reviews.map((review) => {
          const name = review.reviewer?.full_name?.trim() || "Buyer";
          const snippet =
            review.body.length > 140
              ? `${review.body.slice(0, 137).trim()}…`
              : review.body;
          return (
            <article
              key={review.id}
              className="min-w-[210px] max-w-[240px] shrink-0 rounded-2xl border border-navy/8 bg-slate-50/80 p-3.5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-navy/8 bg-navy/5">
                  {review.reviewer?.avatar_url ? (
                    <Image
                      src={review.reviewer.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="m-auto h-4 w-4 text-navy/40" aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-navy dark:text-white">
                    {name}
                  </p>
                  <p className="text-[10px] font-medium text-navy/50 dark:text-white/50">
                    {formatRelativeTime(review.created_at)}
                  </p>
                </div>
              </div>
              <div className="mt-2.5">
                <Stars rating={review.rating} />
              </div>
              <p className="mt-2 text-[11px] leading-snug text-navy/75 dark:text-white/75">
                {snippet}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { isDemoProperty } from "@/lib/mock-listings";
import { cn } from "@/lib/utils";

export function ListingLikeButton({
  listingId,
  initialCount = 0,
  className,
  compact,
}: {
  listingId: string;
  initialCount?: number;
  className?: string;
  compact?: boolean;
}) {
  const { user, guardAction } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const isDemo = isDemoProperty(listingId);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    void fetch(`/api/social/listing-like?listingId=${encodeURIComponent(listingId)}`)
      .then((r) => r.json())
      .then((data: { likeCount?: number; liked?: boolean }) => {
        if (cancelled) return;
        if (typeof data.likeCount === "number") setCount(data.likeCount);
        else setCount(initialCount);
        if (typeof data.liked === "boolean") setLiked(data.liked);
      })
      .catch(() => {
        if (!cancelled) setCount(initialCount);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, initialCount, isDemo]);

  async function toggle() {
    if (isDemo) return;
    setLoading(true);
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(Math.max(0, prevCount + (prevLiked ? -1 : 1)));

    const res = await fetch("/api/social/listing-like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });

    if (!res.ok) {
      setLiked(prevLiked);
      setCount(prevCount);
    } else {
      const data = (await res.json()) as { liked?: boolean; likeCount?: number };
      setLiked(Boolean(data.liked));
      if (typeof data.likeCount === "number") setCount(data.likeCount);
    }
    setLoading(false);
  }

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    guardAction(
      {
        type: "save",
        listingId,
        redirectPath: typeof window !== "undefined" ? window.location.pathname : "/",
      },
      () => void toggle()
    );
  }

  if (isDemo) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-pressed={liked}
      aria-label={liked ? "Unlike listing" : "Like listing"}
      className={cn(
        "pressable inline-flex items-center gap-1 rounded-full text-xs font-semibold transition-colors",
        compact ? "px-2 py-1" : "px-2.5 py-1.5",
        liked
          ? "bg-gold/20 text-navy"
          : "bg-black/[0.04] text-muted hover:bg-black/[0.07] hover:text-navy",
        className
      )}
    >
      <ThumbsUp
        className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", liked && "fill-current")}
      />
      {count > 0 ? <span>{count}</span> : null}
    </button>
  );
}

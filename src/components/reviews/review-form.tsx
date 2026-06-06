"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  agentId: string;
  listingId?: string;
  isAgency?: boolean;
};

export function ReviewForm({ agentId, listingId, isAgency }: Props) {
  const { guardAction, user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  function startReview() {
    guardAction(
      {
        type: "review_agent",
        agentId,
        redirectPath: typeof window !== "undefined" ? window.location.pathname + "#reviews" : undefined,
      },
      () => setOpen(true)
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || rating < 1) return;
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: isAgency ? undefined : agentId,
        company_id: isAgency ? agentId : undefined,
        listing_id: listingId,
        rating,
        review: text,
      }),
    });

    const data = (await res.json()) as { error?: string; message?: string };
    setLoading(false);

    if (!res.ok) {
      setMessage({ type: "err", text: data.error ?? "Could not submit review" });
      return;
    }

    setMessage({ type: "ok", text: data.message ?? "Review submitted." });
    setOpen(false);
    setRating(0);
    setText("");
    window.location.reload();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={startReview}
        className="pressable w-full rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-bold text-navy"
      >
        Write a review
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <p className="text-xs text-muted">
        Keep your review factual, respectful, and based on your experience.
      </p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="pressable p-1"
            aria-label={`${n} stars`}
          >
            <Star
              className={cn(
                "h-7 w-7",
                (hover || rating) >= n ? "fill-gold text-gold" : "text-navy/20"
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your experience (min 10 characters)…"
        rows={4}
        maxLength={1000}
        required
        className="mt-3 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
      />
      {message && (
        <p className={cn("mt-2 text-xs", message.type === "ok" ? "text-emerald-600" : "text-red-600")}>
          {message.text}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl py-2 text-sm text-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || rating < 1 || text.trim().length < 10}
          className="flex-1 rounded-xl bg-gold py-2 text-sm font-bold text-navy disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}

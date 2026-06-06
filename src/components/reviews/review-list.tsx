"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

type Reply = {
  id: string;
  body: string;
  created_at: string;
  author?: { id: string; full_name: string | null; role?: string } | null;
};

type Review = {
  id: string;
  rating: number;
  body: string;
  created_at: string;
  reviewer?: { id: string; full_name: string | null } | null;
  replies?: Reply[];
};

export function ReviewList({
  reviews,
  agentId,
  currentUserId,
}: {
  reviews: Review[];
  agentId: string;
  currentUserId?: string | null;
}) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted">
        No published reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          agentId={agentId}
          currentUserId={currentUserId}
        />
      ))}
    </ul>
  );
}

function ReviewCard({
  review,
  agentId,
  currentUserId,
}: {
  review: Review;
  agentId: string;
  currentUserId?: string | null;
}) {
  const { guardAction, user } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  const canReply =
    user &&
    (review.reviewer?.id === user.id ||
      currentUserId === agentId ||
      user.id === agentId);

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setLoading(true);
    await fetch(`/api/reviews/${review.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyText }),
    });
    setLoading(false);
    setReplyOpen(false);
    window.location.reload();
  }

  async function reportReview() {
    guardAction(
      { type: "review_agent", redirectPath: window.location.pathname },
      async () => {
        const reason = prompt("Why are you reporting this review?");
        if (!reason) return;
        await fetch(`/api/reviews/${review.id}/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });
        alert("Report submitted. Thank you.");
      }
    );
  }

  return (
    <li className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-navy">
            {review.reviewer?.full_name ?? "Yike user"}
          </p>
          <div className="mt-1 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={cn(
                  "h-3.5 w-3.5",
                  n <= review.rating ? "fill-gold text-gold" : "text-navy/15"
                )}
              />
            ))}
          </div>
        </div>
        <time className="text-[10px] text-muted">
          {new Date(review.created_at).toLocaleDateString("en-NG")}
        </time>
      </div>
      <p className="mt-2 text-sm text-navy/90">{review.body}</p>

      {(review.replies ?? []).length > 0 && (
        <ul className="mt-3 space-y-2 border-l-2 border-gold/30 pl-3">
          {(review.replies ?? []).map((rep) => (
            <li key={rep.id} className="text-sm">
              <p className="text-xs font-bold text-muted">
                {rep.author?.full_name ?? "Reply"} ·{" "}
                {rep.author?.role?.includes("agent") || rep.author?.id === agentId
                  ? "Agent"
                  : "User"}
              </p>
              <p className="text-navy/80">{rep.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {canReply && (
          <button
            type="button"
            onClick={() => setReplyOpen(!replyOpen)}
            className="text-xs font-semibold text-gold-dark"
          >
            Reply
          </button>
        )}
        {user && review.reviewer?.id !== user.id && (
          <button
            type="button"
            onClick={() => void reportReview()}
            className="text-xs text-muted hover:text-red-600"
          >
            Report
          </button>
        )}
      </div>

      {replyOpen && (
        <form onSubmit={(e) => void submitReply(e)} className="mt-2 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            maxLength={500}
            className="flex-1 rounded-lg border border-navy/10 px-3 py-2 text-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-navy px-3 py-2 text-xs font-bold text-gold"
          >
            Send
          </button>
        </form>
      )}
    </li>
  );
}

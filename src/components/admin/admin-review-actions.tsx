"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";

const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "flagged", label: "Flagged" },
  { key: "hidden", label: "Hidden" },
] as const;

type ReviewRow = {
  id: string;
  rating: number;
  body: string;
  status: string;
  created_at: string;
  moderation_reason?: string | null;
  reviewer?: { full_name?: string | null; email?: string | null };
  agent?: { full_name?: string | null; agent_type?: string | null };
  replies?: { id: string; body: string; status: string }[];
};

export function AdminReviewActions({
  reviews: initial,
  currentStatus,
}: {
  reviews: ReviewRow[];
  currentStatus?: string;
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function act(
    id: string,
    action: "approve" | "reject" | "hide" | "flag" | "delete",
    reason?: string
  ) {
    if (action === "delete") {
      setPendingDelete(id);
      setShowPin(true);
      return;
    }
    setBusy(id + action);
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reason }),
    });
    setBusy(null);
    router.refresh();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(pendingDelete);
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pendingDelete, action: "delete" }),
    });
    setBusy(null);
    setShowPin(false);
    setPendingDelete(null);
    router.refresh();
  }

  async function replyAct(replyId: string, reply_action: "approve" | "reject" | "hide") {
    setBusy(replyId);
    await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "", reply_id: replyId, reply_action }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const href = tab.key
            ? `/lex/auth/reviews?status=${tab.key}`
            : "/lex/auth/reviews";
          const active = (currentStatus ?? "") === tab.key;
          return (
            <a
              key={tab.key || "all"}
              href={href}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? "bg-gold text-navy" : "bg-white text-muted ring-1 ring-black/5"
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted">No reviews match this filter.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">
                    {r.reviewer?.full_name ?? "User"} → {r.agent?.full_name ?? "Agent"}
                  </p>
                  <p className="text-xs text-muted">
                    {r.rating}★ · {r.status} · {new Date(r.created_at).toLocaleString("en-NG")}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm">{r.body}</p>
              {r.moderation_reason && (
                <p className="mt-1 text-xs text-red-600">Reason: {r.moderation_reason}</p>
              )}

              {(r.replies ?? []).map((rep) => (
                <div key={rep.id} className="mt-2 rounded-lg bg-surface px-3 py-2 text-xs">
                  <p className="text-muted">Reply · {rep.status}</p>
                  <p>{rep.body}</p>
                  {rep.status === "pending" && (
                    <div className="mt-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => void replyAct(rep.id, "approve")}
                        className="rounded bg-emerald-100 px-2 py-1 text-emerald-800"
                      >
                        Approve reply
                      </button>
                      <button
                        type="button"
                        onClick={() => void replyAct(rep.id, "reject")}
                        className="rounded bg-red-50 px-2 py-1 text-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "pending" && (
                  <>
                    <ActionBtn label="Approve" onClick={() => void act(r.id, "approve")} busy={busy} id={r.id + "approve"} />
                    <ActionBtn label="Reject" onClick={() => void act(r.id, "reject")} busy={busy} id={r.id + "reject"} />
                  </>
                )}
                {r.status === "approved" && (
                  <>
                    <ActionBtn label="Hide" onClick={() => void act(r.id, "hide")} busy={busy} id={r.id + "hide"} />
                    <ActionBtn label="Flag" onClick={() => void act(r.id, "flag")} busy={busy} id={r.id + "flag"} />
                  </>
                )}
                <ActionBtn label="Delete" onClick={() => void act(r.id, "delete")} busy={busy} id={r.id + "delete"} danger />
              </div>
            </article>
          ))}
        </div>
      )}

      {showPin && (
        <PinConfirmModal
          onVerified={confirmDelete}
          onCancel={() => {
            setShowPin(false);
            setPendingDelete(null);
          }}
          title="Confirm review deletion"
        />
      )}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  busy,
  id,
  danger,
}: {
  label: string;
  onClick: () => void;
  busy: string | null;
  id: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!!busy}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
        danger ? "bg-red-50 text-red-700" : "bg-surface text-navy"
      }`}
    >
      {busy === id ? "…" : label}
    </button>
  );
}

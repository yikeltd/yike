"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import {
  REVIEW_ACTION_LABELS,
  REVIEW_REQUEST_LABELS,
  type ReviewRequestType,
  type ReviewSuggestedAction,
} from "@/lib/review-memory";
import { riskLabel } from "@/lib/review-memory/suggest";
import type { ReviewJudgment } from "@/lib/review-memory/score";
import type { ReviewRiskLevel } from "@/lib/review-memory/constants";
import { cn } from "@/lib/utils";

type ReviewData = {
  judgment: ReviewJudgment;
  suggestedAction: ReviewSuggestedAction;
  suggestedActionLabel: string;
  queueGroup: string;
  openRequests: { id: string; request_type: string; message: string; status: string }[];
  recentDecisions: { decision_type: string; decision_reason: string | null; created_at: string }[];
  visibilityModifier: number;
  holdStatus: string;
  outcome?: {
    score: number | null;
    evolutionDelta: number;
    signals: { positive?: string[]; negative?: string[] } | null;
    updatedAt: string | null;
  };
  agentOutcome?: {
    quality_score: number;
    review_strictness_modifier: number;
    outcome_summary: Record<string, unknown>;
  } | null;
};

const REQUEST_TYPES: ReviewRequestType[] = [
  "explain",
  "fee_clarity",
  "clearer_photos",
  "location_correction",
  "title_document",
  "upload_proof",
  "update",
];

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70 ? "bg-emerald-500" : value >= 50 ? "bg-gold" : "bg-amber-600";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-bold tabular-nums text-navy">{value}/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function riskBadgeClass(level: ReviewRiskLevel): string {
  switch (level) {
    case "low":
      return "bg-emerald-100 text-emerald-900";
    case "moderate":
      return "bg-amber-100 text-amber-900";
    case "high":
      return "bg-orange-100 text-orange-900";
    case "severe":
      return "bg-red-100 text-red-900";
  }
}

export function AdminListingReviewPanel({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/listings/${listingId}/review`);
    if (res.ok) {
      setData((await res.json()) as ReviewData);
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    action: string,
    extra: Record<string, unknown> = {}
  ) {
    setBusy(action);
    setMessage("");
    const res = await fetch(`/api/admin/listings/${listingId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const body = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setMessage(body.error ?? "Action failed");
      return;
    }
    setMessage("Done");
    router.refresh();
    void load();
  }

  async function sendRequest(requestType: ReviewRequestType) {
    setBusy(`req_${requestType}`);
    setMessage("");
    const res = await fetch(`/api/admin/listings/${listingId}/review/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType }),
    });
    const body = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setMessage(body.error ?? "Request failed");
      return;
    }
    setMessage("Request sent to agent");
    void load();
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-muted">
        Loading scores…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-muted shadow-float">
        Could not load review scores.
      </div>
    );
  }

  const { judgment, suggestedAction, suggestedActionLabel } = data;
  const scores = judgment.scores;

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
            Scores
          </h2>
          <p className="mt-1 text-3xl font-bold text-navy">
            {scores.overall}
            <span className="text-lg font-medium text-muted">/100</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              riskBadgeClass(judgment.riskLevel)
            )}
          >
            Risk: {riskLabel(judgment.riskLevel)}
          </span>
          <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-bold text-navy">
            {suggestedActionLabel}
          </span>
        </div>
      </div>

      {data.outcome && (data.outcome.score != null || data.outcome.evolutionDelta !== 0) && (
        <div className="rounded-xl border border-navy/10 bg-surface/40 p-3">
          <p className="text-xs font-bold uppercase text-muted">Outcome learning</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {data.outcome.score != null && (
              <span className="text-sm font-bold text-navy">
                Live outcome {data.outcome.score}/100
              </span>
            )}
            {data.outcome.evolutionDelta !== 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  data.outcome.evolutionDelta > 0
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-red-100 text-red-900"
                )}
              >
                {data.outcome.evolutionDelta > 0 ? "+" : ""}
                {data.outcome.evolutionDelta} score evolution
              </span>
            )}
          </div>
          {data.agentOutcome && (
            <p className="mt-1 text-xs text-muted">
              Agent quality memory: {data.agentOutcome.quality_score}/100
              {data.agentOutcome.review_strictness_modifier < 0
                ? " · trusted agent (lighter review)"
                : data.agentOutcome.review_strictness_modifier > 0
                  ? " · stricter review applied"
                  : ""}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <ScoreBar label="Photos" value={scores.photo} />
        <ScoreBar label="Pricing confidence" value={scores.pricing} />
        <ScoreBar label="Location" value={scores.location} />
        <ScoreBar label="Description" value={scores.description} />
        <ScoreBar label="Trust/risk (inverse)" value={100 - scores.trustRisk} />
        <ScoreBar label="Completion" value={scores.completion} />
        <ScoreBar label="Naija flexibility" value={scores.naijaFlex} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-xs font-bold uppercase text-emerald-800">What looks good</p>
          <ul className="mt-2 space-y-1 text-sm text-emerald-900">
            {judgment.good.length === 0 ? (
              <li className="text-muted">—</li>
            ) : (
              judgment.good.map((g) => <li key={g}>✓ {g}</li>)
            )}
          </ul>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-xs font-bold uppercase text-amber-900">Needs attention</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-950">
            {judgment.attention.length === 0 ? (
              <li className="text-muted">—</li>
            ) : (
              judgment.attention.map((a) => <li key={a}>• {a}</li>)
            )}
          </ul>
        </div>
      </div>

      {data.openRequests.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-3">
          <p className="text-xs font-bold text-navy">Open agent requests</p>
          <ul className="mt-2 space-y-2 text-sm">
            {data.openRequests.map((r) => (
              <li key={r.id} className="text-muted">
                <span className="font-semibold text-navy">{r.request_type}</span>:{" "}
                {r.message.slice(0, 120)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase text-muted">Suggested action</p>
        <p className="text-sm font-semibold text-navy">
          {REVIEW_ACTION_LABELS[suggestedAction]}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => requirePin(() => runAction("approve"))}
          className="pressable min-h-[44px] rounded-xl bg-gold text-sm font-bold text-navy"
        >
          {busy === "approve" ? "…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => requirePin(() => runAction("approve_rank_lower"))}
          className="pressable min-h-[44px] rounded-xl bg-navy/10 text-sm font-bold text-navy"
        >
          Approve, rank lower
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => requirePin(() => runAction("reject", { decisionType: "rejected" }))}
          className="pressable min-h-[44px] rounded-xl bg-surface text-sm font-bold text-muted"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => requirePin(() => runAction("hold"))}
          className="pressable min-h-[44px] rounded-xl bg-surface text-sm font-bold text-muted"
        >
          Hold for review
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase text-muted">Ask agent / company</p>
        <div className="flex flex-wrap gap-2">
          {REQUEST_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              disabled={!!busy}
              onClick={() => requirePin(() => sendRequest(t))}
              className="pressable rounded-full bg-white px-3 py-2 text-xs font-semibold text-navy shadow-float"
            >
              {busy === `req_${t}` ? "…" : REVIEW_REQUEST_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {message && <p className="text-sm text-muted">{message}</p>}
      {pinModal}
    </div>
  );
}

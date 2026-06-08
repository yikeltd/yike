"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  CareerFollowUpRow,
  FollowUpRecommendation,
  FollowUpResponseScore,
} from "@/lib/careers/follow-up/types";
import { FOLLOW_UP_RECOMMENDATION_LABELS } from "@/lib/careers/follow-up/types";
import type { ApplicationStatus } from "@/lib/careers/constants";
import { cn } from "@/lib/utils";

const PIPELINE_ACTIONS: {
  label: string;
  applicationStatus?: ApplicationStatus;
  recommendation?: FollowUpRecommendation;
  note: string;
  style: string;
}[] = [
  {
    label: "Shortlist for interview",
    applicationStatus: "interview",
    recommendation: "needs_interview",
    note: "Shortlisted for video interview after follow-up review.",
    style: "bg-navy text-white",
  },
  {
    label: "Mark strong candidate",
    applicationStatus: "shortlisted",
    recommendation: "strong_fit",
    note: "Strong candidate — follow-up responses were excellent.",
    style: "bg-gold text-navy font-bold",
  },
  {
    label: "Request more info",
    applicationStatus: "review",
    note: "Need more information after follow-up.",
    style: "bg-surface text-navy",
  },
  {
    label: "Put on hold",
    applicationStatus: "review",
    note: "On hold pending further review.",
    style: "bg-surface text-muted",
  },
  {
    label: "Reject politely",
    applicationStatus: "rejected",
    recommendation: "not_suitable",
    note: "Not moving forward after follow-up review.",
    style: "bg-red-50 text-red-700",
  },
  {
    label: "Not suitable",
    applicationStatus: "rejected",
    recommendation: "not_suitable",
    note: "Not suitable based on follow-up responses.",
    style: "bg-red-50 text-red-800",
  },
];

function scoreBar(label: string, value: number) {
  return (
    <div key={label}>
      <div className="flex justify-between text-[11px] text-muted">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-gold"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function FollowUpReviewPanel({
  followUp,
  applicationId,
}: {
  followUp: CareerFollowUpRow;
  applicationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState(followUp.admin_notes ?? "");
  const [interviewNotes, setInterviewNotes] = useState(followUp.interview_notes ?? "");
  const [interviewLink, setInterviewLink] = useState(followUp.interview_link ?? "");

  const score = followUp.response_score as FollowUpResponseScore | null;
  const answers = followUp.answers ?? {};

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/admin/careers/follow-up/${followUp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  async function runAction(action: (typeof PIPELINE_ACTIONS)[number]) {
    setBusy(action.label);
    await patch({
      applicationId,
      applicationStatus: action.applicationStatus,
      recommendation: action.recommendation,
      note: action.note,
      adminNotes: adminNotes.trim() || undefined,
    });
    setBusy(null);
  }

  async function saveNotes() {
    setBusy("notes");
    await patch({
      adminNotes,
      interviewNotes,
      interviewLink,
    });
    setBusy(null);
  }

  const statusLabel =
    followUp.status === "submitted"
      ? "Submitted"
      : followUp.status === "opened"
        ? "Opened"
        : followUp.status === "sent"
          ? "Sent"
          : followUp.status;

  return (
    <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
            Follow-up questionnaire
          </p>
          <p className="text-sm text-muted">
            {statusLabel}
            {followUp.sent_at && ` · sent ${new Date(followUp.sent_at).toLocaleDateString("en-NG")}`}
            {followUp.submitted_at &&
              ` · submitted ${new Date(followUp.submitted_at).toLocaleDateString("en-NG")}`}
          </p>
        </div>
        {followUp.recommendation && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-navy ring-1 ring-black/5">
            {FOLLOW_UP_RECOMMENDATION_LABELS[followUp.recommendation]}
          </span>
        )}
      </div>

      {followUp.status === "submitted" && score && (
        <div className="grid gap-2 sm:grid-cols-2">
          {scoreBar("Overall", score.overall)}
          {scoreBar("Communication", score.communicationClarity)}
          {scoreBar("Role fit", score.roleFit)}
          {scoreBar("Experience", score.experienceRelevance)}
          {scoreBar("Salary fit", score.salaryFit)}
          {scoreBar("Availability", score.availabilityFit)}
        </div>
      )}

      {(followUp.strengths?.length > 0 || followUp.red_flags?.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          {followUp.strengths?.length > 0 && (
            <div>
              <p className="font-semibold text-emerald-700">Strengths</p>
              <ul className="mt-1 list-disc pl-4 text-muted">
                {followUp.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {followUp.red_flags?.length > 0 && (
            <div>
              <p className="font-semibold text-red-700">Red flags</p>
              <ul className="mt-1 list-disc pl-4 text-muted">
                {followUp.red_flags.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {followUp.status === "submitted" && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-gold-dark">
            View answers ({Object.keys(answers).length})
          </summary>
          <div className="mt-2 space-y-3">
            {followUp.questions.map((q) => (
              <div key={q.id} className="rounded-lg bg-white p-3">
                <p className="text-xs font-semibold text-navy">{q.label}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                  {answers[q.id]?.trim() || "—"}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {followUp.status === "submitted" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {PIPELINE_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={!!busy}
              onClick={() => void runAction(action)}
              className={cn(
                "pressable rounded-xl px-3 py-2 text-xs disabled:opacity-60",
                action.style
              )}
            >
              {busy === action.label ? "…" : action.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t border-gold/20 pt-3">
        <p className="text-xs font-semibold text-navy">Admin & interview notes</p>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes on follow-up"
          rows={2}
          className="w-full rounded-xl border border-navy/10 px-3 py-2 text-xs"
        />
        <textarea
          value={interviewNotes}
          onChange={(e) => setInterviewNotes(e.target.value)}
          placeholder="Interview notes"
          rows={2}
          className="w-full rounded-xl border border-navy/10 px-3 py-2 text-xs"
        />
        <input
          value={interviewLink}
          onChange={(e) => setInterviewLink(e.target.value)}
          placeholder="Interview link (optional)"
          className="w-full rounded-xl border border-navy/10 px-3 py-2 text-xs"
        />
        <button
          type="button"
          disabled={busy === "notes"}
          onClick={() => void saveNotes()}
          className="pressable rounded-xl bg-white px-4 py-2 text-xs font-semibold text-navy ring-1 ring-black/5"
        >
          {busy === "notes" ? "Saving…" : "Save notes"}
        </button>
      </div>
    </div>
  );
}

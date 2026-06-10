"use client";

import { useState } from "react";
import { SendFollowUpModal } from "@/components/admin/send-follow-up-modal";
import type { CareerFollowUpRow, FollowUpGenerationInput } from "@/lib/careers/follow-up/types";
import type { FollowUpQuestion } from "@/lib/careers/follow-up/types";

export function SendFollowUpButton({
  applicationId,
  applicantName,
  jobTitle,
  applicationStatus,
  latestFollowUp,
  generationInput,
  savedTemplate,
}: {
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  applicationStatus: string;
  latestFollowUp?: CareerFollowUpRow | null;
  generationInput: FollowUpGenerationInput;
  savedTemplate?: FollowUpQuestion[] | null;
}) {
  const [open, setOpen] = useState(false);

  const pending =
    latestFollowUp &&
    ["sent", "opened"].includes(latestFollowUp.status) &&
    latestFollowUp.status !== "submitted";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-bold text-navy"
      >
        {pending ? "Resend follow-up" : "Send follow-up"}
      </button>
      {open && (
        <SendFollowUpModal
          applicationId={applicationId}
          applicantName={applicantName}
          jobTitle={jobTitle}
          generationInput={generationInput}
          savedTemplate={savedTemplate}
          onClose={() => setOpen(false)}
        />
      )}
      {latestFollowUp?.status === "sent" && (
        <span className="text-[10px] text-muted">Follow-up sent — awaiting response</span>
      )}
      {applicationStatus === "shortlisted" && !latestFollowUp && (
        <span className="text-[10px] text-muted">Shortlisted — send follow-up before interview</span>
      )}
    </>
  );
}

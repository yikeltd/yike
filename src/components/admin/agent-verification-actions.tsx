"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import { Button } from "@/components/ui/button";
import {
  AGENT_VERIFICATION_CALL_MESSAGE,
  formatVerificationCallTime,
  verificationCallStatusLabel,
  VERIFICATION_WHATSAPP_NUMBER,
  yikeVerificationWhatsAppLink,
} from "@/lib/agent-verification";
import type { AgentVerification, VerificationCallStatus } from "@/types/database";

export function AgentVerificationActions({
  verificationId,
  agentId,
  verification,
}: {
  verificationId: string;
  agentId: string;
  verification?: Pick<
    AgentVerification,
    "verification_call_status" | "verification_call_time" | "verification_whatsapp_number"
  > | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [callTime, setCallTime] = useState("");
  const [notes, setNotes] = useState("");

  const status = verification?.verification_call_status ?? "not_scheduled";
  const scheduledAt = formatVerificationCallTime(verification?.verification_call_time);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/admin/agents/verification", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification_id: verificationId, agent_id: agentId, ...body }),
    });
    setBusy(false);
    router.refresh();
  }

  function requestPin(action: "approve" | "reject") {
    setPendingAction(action);
    setShowPin(true);
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-navy/10 bg-surface/50 p-3">
      <div>
        <p className="text-xs font-bold uppercase text-muted">WhatsApp verification call</p>
        <p className="mt-1 text-xs text-navy/80">
          Yike official WhatsApp:{" "}
          <a
            href={yikeVerificationWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold-dark underline"
          >
            +{VERIFICATION_WHATSAPP_NUMBER}
          </a>
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Status: {verificationCallStatusLabel(status as VerificationCallStatus)}
          {scheduledAt ? ` · ${scheduledAt}` : ""}
        </p>
      </div>

      <p className="rounded-lg bg-white px-3 py-2 text-[11px] leading-relaxed text-muted">
        Agent message: &ldquo;{AGENT_VERIFICATION_CALL_MESSAGE}&rdquo;
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted">
          Call time
          <input
            type="datetime-local"
            value={callTime}
            onChange={(e) => setCallTime(e.target.value)}
            className="mt-1 block rounded-lg border border-navy/10 px-2 py-1.5 text-xs text-navy"
          />
        </label>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !callTime}
          onClick={() =>
            void patch({
              action: status === "scheduled" ? "reschedule_call" : "schedule_call",
              call_time: new Date(callTime).toISOString(),
              notes,
            })
          }
        >
          {status === "scheduled" ? "Reschedule" : "Schedule call"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void patch({ action: "complete_call", notes })}>
          Completed
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void patch({ action: "missed_call", notes })}>
          Missed
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void patch({ action: "failed_call", notes })}>
          Failed
        </Button>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Verification notes (ID check, NIN, selfie, company details…)"
        rows={2}
        className="w-full rounded-lg border border-navy/10 px-2 py-1.5 text-xs"
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => requestPin("approve")}>
          Approve verified
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => requestPin("reject")}>
          Reject
        </Button>
      </div>

      {showPin && pendingAction && (
        <PinConfirmModal
          onVerified={async () => {
            await patch({
              action: pendingAction,
              notes,
              rejection_reason: pendingAction === "reject" ? notes : undefined,
            });
            setShowPin(false);
            setPendingAction(null);
          }}
          onCancel={() => {
            setShowPin(false);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}

export function AgentStatusActions({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const [action, setAction] = useState<"suspend" | "reinstate" | "delete" | null>(null);
  const [reason, setReason] = useState("");

  async function execute() {
    if (!action) return;
    await fetch("/api/admin/agents/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId, action, reason }),
    });
    setShowPin(false);
    setAction(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="danger"
        onClick={() => {
          setAction("suspend");
          setShowPin(true);
        }}
      >
        Suspend
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setAction("reinstate");
          setShowPin(true);
        }}
      >
        Reinstate
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setAction("delete");
          setShowPin(true);
        }}
      >
        Delete profile
      </Button>
      {showPin && (
        <PinConfirmModal
          onVerified={execute}
          onCancel={() => {
            setShowPin(false);
            setAction(null);
          }}
          title={`Confirm ${action} agent`}
        />
      )}
      {action && (
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (required for audit)"
          className="w-full rounded-lg border border-navy/10 px-2 py-1 text-xs"
        />
      )}
    </div>
  );
}

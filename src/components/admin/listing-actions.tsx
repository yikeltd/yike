"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { AdminRecommendedEdits } from "@/components/admin/admin-recommended-edits";
import { normalizeWhatsApp } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/database";

type ModerateAction =
  | "approve"
  | "reject"
  | "hide"
  | "flag"
  | "request_edits"
  | "rented"
  | "pending";

export function ListingActions({
  propertyId,
  title,
  status = "pending",
  agentVerified,
  agentId,
  agentName,
  agentWhatsapp,
  agentPhone,
  compact,
}: {
  propertyId: string;
  title?: string;
  status?: PropertyStatus;
  agentVerified?: boolean;
  agentId?: string;
  agentName?: string;
  agentWhatsapp?: string | null;
  agentPhone?: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [editsOpen, setEditsOpen] = useState(false);

  const reviewHref = `/lex/auth/listings/${propertyId}`;
  const agentHref = agentId ? `/lex/auth/agents/${agentId}` : null;
  const waNumber = normalizeWhatsApp(agentWhatsapp ?? agentPhone ?? "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Hi ${agentName ?? "there"}, regarding your listing "${title ?? "on Yike"}": `
      )}`
    : null;

  async function moderate(action: ModerateAction) {
    setBusy(action);
    setMessage("");
    const res = await fetch(`/api/admin/listings/${propertyId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        agent_verified: agentVerified,
      }),
    });
    const body = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setMessage(body.error ?? "Action failed");
      return;
    }
    if (action === "approve" || action === "reject") {
      void fetch("/api/notifications/email/listing-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          status: action === "approve" ? "approved" : "rejected",
        }),
      });
    }
    setMessage("Done");
    router.refresh();
  }

  async function reviewAction(action: "hold" | "approve_rank_lower") {
    setBusy(action);
    setMessage("");
    const res = await fetch(`/api/admin/listings/${propertyId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setMessage(body.error ?? "Action failed");
      return;
    }
    setMessage("Done");
    router.refresh();
  }

  async function featureListing() {
    setBusy("feature");
    setMessage("");
    const featuredUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`/api/admin/listings/${propertyId}/feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "feature",
        featured_until: featuredUntil,
        featured_tier: "basic",
        featured_reason: "Staff featured",
      }),
    });
    const body = (await res.json()) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      setMessage(body.error ?? "Could not feature");
      return;
    }
    setMessage("Featured");
    router.refresh();
  }

  function ActionBtn({
    label,
    actionKey,
    onClick,
    variant = "surface",
  }: {
    label: string;
    actionKey: string;
    onClick: () => void;
    variant?: "gold" | "navy" | "surface" | "danger";
  }) {
    const styles = {
      gold: "bg-gold text-navy font-bold",
      navy: "bg-navy text-gold font-bold",
      surface: "bg-surface text-navy font-semibold",
      danger: "bg-red-50 text-red-800 font-semibold",
    };
    return (
      <button
        type="button"
        disabled={!!busy}
        onClick={() => requirePin(onClick)}
        className={cn(
          "pressable min-h-[36px] rounded-lg px-2.5 text-[11px] disabled:opacity-50",
          styles[variant]
        )}
      >
        {busy === actionKey ? "…" : label}
      </button>
    );
  }

  const showApprove = status !== "approved";
  const showReject = status === "pending" || status === "flagged";
  const showRented = status === "approved";
  const showRequeue = status !== "pending";
  const showHide = status !== "hidden" && status !== "rented";
  const showFeature = status === "approved" || status === "pending";

  return (
    <div className={cn("space-y-2", compact ? "min-w-[200px]" : "min-w-[240px]")}>
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={reviewHref}
          className="pressable inline-flex min-h-[36px] items-center rounded-lg bg-navy/10 px-2.5 text-[11px] font-bold text-navy"
        >
          Review
        </Link>
        <button
          type="button"
          onClick={() => setEditsOpen((v) => !v)}
          className={cn(
            "pressable min-h-[36px] rounded-lg px-2.5 text-[11px] font-bold",
            editsOpen ? "bg-gold text-navy" : "bg-surface text-navy"
          )}
        >
          {editsOpen ? "Close edits" : "Request edits"}
        </button>
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex min-h-[36px] items-center rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white"
          >
            WhatsApp
          </a>
        ) : null}
        {agentHref ? (
          <Link
            href={agentHref}
            className="pressable inline-flex min-h-[36px] items-center rounded-lg bg-surface px-2.5 text-[11px] font-bold text-navy"
          >
            Agent
          </Link>
        ) : null}
      </div>

      <div
        className={cn(
          "flex flex-wrap gap-1.5",
          compact ? "" : "gap-2"
        )}
      >
        {showApprove ? (
          <ActionBtn
            label="Approve"
            actionKey="approve"
            variant="gold"
            onClick={() => void moderate("approve")}
          />
        ) : null}
        {showReject ? (
          <ActionBtn
            label="Reject"
            actionKey="reject"
            variant="danger"
            onClick={() => void moderate("reject")}
          />
        ) : null}
        {showHide ? (
          <ActionBtn
            label="Hide"
            actionKey="hide"
            onClick={() => void moderate("hide")}
          />
        ) : null}
        {showRented ? (
          <ActionBtn
            label="Rented"
            actionKey="rented"
            onClick={() => void moderate("rented")}
          />
        ) : null}
        {showRequeue ? (
          <ActionBtn
            label="Re-queue"
            actionKey="pending"
            onClick={() => void moderate("pending")}
          />
        ) : null}
        {showFeature ? (
          <ActionBtn
            label="Feature"
            actionKey="feature"
            variant="navy"
            onClick={() => void featureListing()}
          />
        ) : null}
      </div>

      <details className="text-[11px]">
        <summary className="cursor-pointer font-bold text-gold-dark">More actions</summary>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <ActionBtn
            label="Hold"
            actionKey="hold"
            onClick={() => void reviewAction("hold")}
          />
          <ActionBtn
            label="Flag"
            actionKey="flag"
            onClick={() => void moderate("flag")}
          />
          <ActionBtn
            label="Rank lower"
            actionKey="approve_rank_lower"
            onClick={() => void reviewAction("approve_rank_lower")}
          />
          <ActionBtn
            label="Ask update"
            actionKey="request_edits"
            onClick={() => void moderate("request_edits")}
          />
        </div>
      </details>

      {editsOpen ? (
        <div className="rounded-xl border border-navy/10 bg-surface/30 p-2">
          <AdminRecommendedEdits listingId={propertyId} embedded />
        </div>
      ) : null}

      {!waHref && !agentPhone && !agentWhatsapp ? (
        <p className="text-[10px] text-muted">No agent contact on file</p>
      ) : null}

      {message ? <p className="text-[10px] text-muted">{message}</p> : null}
      {pinModal}
    </div>
  );
}

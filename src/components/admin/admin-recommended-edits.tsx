"use client";

import { useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import {
  RECOMMENDED_EDIT_OPTIONS,
  buildRecommendedEditMessage,
} from "@/lib/review-memory/recommended-edits";
import type { ReviewRequestType } from "@/lib/review-memory/constants";
import { cn } from "@/lib/utils";

export function AdminRecommendedEdits({
  listingId,
  embedded,
}: {
  listingId: string;
  embedded?: boolean;
}) {
  const { requirePin, pinModal } = usePinGate();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<ReviewRequestType>>(new Set());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function toggle(type: ReviewRequestType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function send() {
    if (selected.size === 0) {
      setMessage("Select at least one item.");
      return;
    }
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/admin/listings/${listingId}/review/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestTypes: [...selected],
        message: buildRecommendedEditMessage([...selected], note),
      }),
    });
    const body = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(body.error ?? "Could not send edit request. Please try again.");
      return;
    }
    setMessage("Edit request sent.");
    setSelected(new Set());
    setNote("");
    setOpen(false);
  }

  const Wrapper = embedded ? "div" : "section";
  const wrapperClass = embedded
    ? "space-y-3"
    : "rounded-2xl border border-navy/10 bg-white p-4 shadow-sm space-y-3";

  return (
    <Wrapper className={wrapperClass}>
      {!embedded ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pressable flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="text-sm font-bold text-navy">Recommended edits</span>
          <span className="text-xs font-bold text-gold-dark">{open ? "Close" : "Open"}</span>
        </button>
      ) : null}

      {(embedded || open) ? (
        <div className={cn("space-y-3", !embedded && "border-t border-navy/8 pt-3")}>
          <p className="text-xs text-muted">Select what the agent should fix, then send.</p>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_EDIT_OPTIONS.map((opt) => {
              const active = selected.has(opt.type);
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => toggle(opt.type)}
                  className={cn(
                    "pressable rounded-full px-3 py-2 text-xs font-bold",
                    active
                      ? "bg-gold text-navy shadow-glow-gold"
                      : "bg-surface text-navy ring-1 ring-navy/10"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Short note (optional)"
            className="w-full rounded-xl border border-navy/15 px-3 py-2 text-sm"
            maxLength={200}
          />
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => requirePin(() => void send())}
            className="pressable min-h-[44px] w-full rounded-xl bg-navy text-sm font-bold text-gold disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send to agent"}
          </button>
        </div>
      ) : null}

      {message ? <p className="text-sm text-muted">{message}</p> : null}
      {pinModal}
    </Wrapper>
  );
}

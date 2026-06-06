"use client";

import { useState } from "react";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import type { ReviewPublishingMode } from "@/types/database";

export function ReviewPublishingSettings({
  initialMode,
}: {
  initialMode: ReviewPublishingMode;
}) {
  const [mode, setMode] = useState(initialMode);
  const [showPin, setShowPin] = useState(false);
  const [pendingMode, setPendingMode] = useState<ReviewPublishingMode | null>(null);
  const [message, setMessage] = useState("");

  async function save() {
    if (!pendingMode) return;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_publishing_mode: pendingMode }),
    });
    if (res.ok) {
      setMode(pendingMode);
      setMessage("Setting updated.");
    } else {
      const data = (await res.json()) as { error?: string };
      setMessage(data.error ?? "Update failed");
    }
    setShowPin(false);
    setPendingMode(null);
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-navy">Review publishing</h2>
      <p className="mt-1 text-sm text-muted">
        Default is manual review. Auto-publish still allows flags and post-moderation.
      </p>
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={mode === "manual_review"}
            onChange={() => {
              setPendingMode("manual_review");
              setShowPin(true);
            }}
          />
          Manual review — all reviews pending until approved
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            checked={mode === "auto_publish"}
            onChange={() => {
              setPendingMode("auto_publish");
              setShowPin(true);
            }}
          />
          Auto publish — pass spam filter, still reportable
        </label>
      </div>
      {message && <p className="mt-2 text-xs text-muted">{message}</p>}
      {showPin && (
        <PinConfirmModal
          onVerified={save}
          onCancel={() => {
            setShowPin(false);
            setPendingMode(null);
          }}
          title="Confirm publishing mode change"
        />
      )}
    </div>
  );
}

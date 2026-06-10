"use client";

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CallSafetyModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-5 shadow-float-lg"
      >
        <p className="text-lg font-bold text-navy">Before you call</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We&apos;ll connect you to the agent. Any viewing or agency fees are
          between you and the agent — pay when and if you are comfortable.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button type="button" fullWidth onClick={onConfirm}>
            <Phone className="mr-2 h-4 w-4" />
            Call agent
          </Button>
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

const SAFETY_SEEN_KEY = "yike_contact_safety_seen";

export function hasSeenContactSafety(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SAFETY_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markContactSafetySeen(): void {
  try {
    localStorage.setItem(SAFETY_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

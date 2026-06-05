"use client";

import { Loader2 } from "lucide-react";

export function SubmitOverlay({
  show,
  message = "Saving…",
}: {
  show: boolean;
  message?: string;
}) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="glass shadow-float-lg flex flex-col items-center gap-3 rounded-2xl px-8 py-6">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm font-semibold text-foreground">{message}</p>
      </div>
    </div>
  );
}

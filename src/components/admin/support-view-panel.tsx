"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  userId: string;
  userName: string;
  canView: boolean;
  activeSession?: {
    targetUserId: string;
    targetUserName: string | null;
  } | null;
};

export function SupportViewPanel({
  userId,
  userName,
  canView,
  activeSession,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!canView) return null;

  const isViewingThisUser = activeSession?.targetUserId === userId;

  async function startView() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/support-view/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: userId }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not start support view.");
      return;
    }
    router.refresh();
  }

  async function endView() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/support-view/end", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not end support view.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-navy">Safe support view</p>
          <p className="text-xs text-muted">
            Read-only account context for debugging — all access is logged
          </p>
        </div>
        {isViewingThisUser ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => void endView()}
            disabled={busy}
            className="gap-2"
          >
            <EyeOff className="h-4 w-4" />
            End view
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void startView()}
            disabled={busy}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View as {userName}
          </Button>
        )}
      </div>
      {isViewingThisUser ? (
        <p className="mt-2 text-xs font-semibold text-gold-dark">
          Active: viewing {activeSession?.targetUserName ?? userName} (read-only).
          Sensitive actions require admin PIN and are attributed to you.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

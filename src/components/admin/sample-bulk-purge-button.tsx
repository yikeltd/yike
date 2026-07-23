"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

/** Admin-only: purge all DB sample / demo seed listings in one click. */
export function SampleBulkPurgeButton() {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function purge() {
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/admin/sample-listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "bulk" }),
    });
    const body = (await res.json()) as { error?: string; deleted?: number };
    setBusy(false);
    if (!res.ok) {
      setMessage(body.error ?? "Purge failed");
      return;
    }
    setMessage(`Removed ${body.deleted ?? 0} sample listing(s)`);
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => requirePin(() => void purge())}
        className="pressable rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 disabled:opacity-50"
      >
        {busy ? "Removing…" : "Remove all sample listings"}
      </button>
      {message ? (
        <span className="text-xs font-medium text-muted">{message}</span>
      ) : null}
      {pinModal}
    </div>
  );
}

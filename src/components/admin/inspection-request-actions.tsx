"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import type {
  InspectionPaymentStatus,
  InspectionRequest,
  InspectionRequestStatus,
} from "@/types/database";
import { formatIntegerTyping, parseNairaAmount } from "@/lib/naira-input";

const STATUSES: InspectionRequestStatus[] = [
  "pending",
  "contacted",
  "assigned",
  "scheduled",
  "completed",
  "rejected",
  "cancelled",
];

const PAYMENTS: InspectionPaymentStatus[] = [
  "not_requested",
  "requested",
  "paid",
  "waived",
  "refunded",
];

export function InspectionRequestActions({
  request,
}: {
  request: InspectionRequest;
}) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [status, setStatus] = useState(request.status);
  const [paymentStatus, setPaymentStatus] = useState(request.payment_status);
  const [fee, setFee] = useState(
    request.inspection_fee_amount != null
      ? String(request.inspection_fee_amount)
      : ""
  );
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(needsPin: boolean) {
    const payload = {
      id: request.id,
      status,
      payment_status: paymentStatus,
      inspection_fee_amount: fee ? parseNairaAmount(fee) ?? Number(fee) : null,
      admin_notes: adminNotes,
    };

    const run = async () => {
      setBusy(true);
      setError(null);
      const res = await fetch("/api/support/inspection-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      setBusy(false);
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      router.refresh();
    };

    if (needsPin) requirePin(run);
    else void run();
  }

  const pinRequired =
    paymentStatus === "paid" ||
    paymentStatus === "waived" ||
    status === "completed";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface/40 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-navy">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as InspectionRequestStatus)}
            className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-navy">
          Payment
          <select
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as InspectionPaymentStatus)
            }
            className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
          >
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>
                {p.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-navy sm:col-span-2">
          Inspection fee (₦)
          <input
            type="text"
            inputMode="decimal"
            value={fee}
            onChange={(e) => setFee(formatIntegerTyping(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-navy sm:col-span-2">
          Admin notes
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => save(pinRequired)}
        className="pressable min-h-[44px] rounded-xl bg-navy px-4 text-sm font-bold text-gold"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
      {pinModal}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import { isHighRiskAction } from "@/lib/admin/audit-risk";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  actionType?: string;
  requireReason?: boolean;
  requirePin?: boolean;
  bulkCount?: number;
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
};

export function DestructiveActionModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  actionType,
  requireReason,
  requirePin,
  bulkCount,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  if (!open) return null;

  const needsReason =
    requireReason ?? (actionType ? isHighRiskAction(actionType) : false);
  const needsPin =
    requirePin ?? (actionType ? isHighRiskAction(actionType) : false);

  async function execute() {
    if (needsReason && reason.trim().length < 3) {
      setError("Please provide a reason (at least 3 characters).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (needsPin) {
      setShowPin(true);
      return;
    }
    void execute();
  }

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <p className="mt-2 text-sm text-muted">{description}</p>
          {bulkCount != null && bulkCount > 1 ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
              You are about to affect {bulkCount} records.
            </p>
          ) : null}
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-muted">
                Reason {needsReason ? "(required)" : "(optional)"}
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Fraud investigation, user support, duplicate listing abuse"
                rows={3}
                className="mt-1"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                disabled={loading || (needsReason && reason.trim().length < 3)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {loading ? "Processing…" : confirmLabel}
              </Button>
            </div>
          </form>
          {needsPin ? (
            <p className="mt-3 text-center text-[10px] text-muted">
              Admin PIN required to complete this action
            </p>
          ) : null}
        </div>
      </div>
      {showPin ? (
        <PinConfirmModal
          title="Confirm with admin PIN"
          description="This high-risk action requires your admin PIN."
          onVerified={async () => {
            setShowPin(false);
            await execute();
          }}
          onCancel={() => setShowPin(false)}
        />
      ) : null}
    </>
  );
}

export function useDestructiveAction() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    actionType?: string;
    requireReason?: boolean;
    requirePin?: boolean;
    bulkCount?: number;
    onConfirm?: (reason: string) => void | Promise<void>;
  }>({ open: false, title: "", description: "" });

  function confirm(opts: Omit<typeof state, "open">) {
    setState({ ...opts, open: true });
  }

  function close() {
    setState((s) => ({ ...s, open: false, onConfirm: undefined }));
  }

  const modal = (
    <DestructiveActionModal
      open={state.open}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      actionType={state.actionType}
      requireReason={state.requireReason}
      requirePin={state.requirePin}
      bulkCount={state.bulkCount}
      onCancel={close}
      onConfirm={async (reason) => {
        if (state.onConfirm) await state.onConfirm(reason);
        close();
      }}
    />
  );

  return { confirm, destructiveModal: modal };
}

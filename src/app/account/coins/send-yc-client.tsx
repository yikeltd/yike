"use client";

import { useCallback, useMemo, useState } from "react";
import { formatYc } from "@/lib/yike-coins/constants";

type RecipientPreview = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type Props = {
  balanceCoins: number;
  hasUsername: boolean;
};

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `client:${crypto.randomUUID()}`;
  }
  return `client:${Date.now()}`;
}

export function SendYcClient({ balanceCoins, hasUsername }: Props) {
  const [recipient, setRecipient] = useState("");
  const [preview, setPreview] = useState<RecipientPreview | null>(null);
  const [amount, setAmount] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [sending, setSending] = useState(false);
  const [balance, setBalance] = useState(balanceCoins);

  const amountInt = useMemo(() => {
    const n = Number(amount);
    return Number.isInteger(n) ? n : 0;
  }, [amount]);

  const lookup = useCallback(async () => {
    setLookingUp(true);
    setLookupError(null);
    setPreview(null);
    setSuccess(null);
    try {
      const q = encodeURIComponent(recipient.trim().replace(/^@/, ""));
      const res = await fetch(`/api/username/lookup?username=${q}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setLookupError(json.error ?? "User not found");
        return;
      }
      setPreview({
        username: json.username,
        displayName: json.displayName,
        avatarUrl: json.avatarUrl,
      });
    } finally {
      setLookingUp(false);
    }
  }, [recipient]);

  async function send() {
    if (!preview) return;
    setSending(true);
    setTransferError(null);
    setSuccess(null);
    const idempotencyKey = newIdempotencyKey();
    try {
      const res = await fetch("/api/yike-coins/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          recipientUsername: preview.username,
          amountCoins: amountInt,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setTransferError(json.error ?? "Transfer failed");
        return;
      }
      setBalance(json.balanceAfter ?? balance);
      setSuccess(
        json.alreadyApplied
          ? "Transfer already recorded."
          : `Sent ${formatYc(amountInt)} to @${preview.username}. Ref ${json.transferReference}.`
      );
      setAmount("");
      setPreview(null);
      setRecipient("");
    } finally {
      setSending(false);
    }
  }

  if (!hasUsername) {
    return (
      <p className="mt-4 text-sm text-navy/60">
        Claim a username above to send YC to others.
      </p>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black text-navy">Send YC</h2>
      <p className="mt-1 text-xs text-navy/55">
        Available: <span className="font-bold text-navy">{formatYc(balance)}</span>
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.replace(/^@/, ""))}
          placeholder="Recipient username"
          className="min-h-[44px] flex-1 rounded-xl border border-navy/15 px-3 text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => void lookup()}
          disabled={lookingUp || recipient.trim().length < 3}
          className="pressable min-h-[44px] rounded-xl border border-navy/15 px-4 text-sm font-bold text-navy"
        >
          {lookingUp ? "Checking…" : "Find user"}
        </button>
      </div>
      {lookupError ? <p className="mt-2 text-xs text-red-700">{lookupError}</p> : null}

      {preview ? (
        <div className="mt-3 rounded-xl bg-surface/80 p-3 text-sm">
          <p className="font-semibold text-navy">{preview.displayName}</p>
          <p className="text-xs text-muted">@{preview.username}</p>
        </div>
      ) : null}

      {preview ? (
        <div className="mt-3">
          <label className="text-xs font-semibold text-navy">
            Amount (YC)
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-navy/15 px-3 text-sm"
              placeholder="0"
            />
          </label>
          {amountInt > balance ? (
            <p className="mt-2 text-xs text-red-700">Insufficient balance</p>
          ) : null}
          <button
            type="button"
            disabled={sending || amountInt <= 0 || amountInt > balance}
            onClick={() => void send()}
            className="pressable yike-btn-accent mt-3 min-h-[48px] w-full rounded-2xl bg-gold text-sm font-bold text-navy disabled:opacity-50"
          >
            {sending ? "Sending…" : `Confirm send ${amountInt > 0 ? formatYc(amountInt) : ""}`}
          </button>
        </div>
      ) : null}

      {transferError ? <p className="mt-2 text-xs text-red-700">{transferError}</p> : null}
      {success ? <p className="mt-2 text-xs text-emerald-800">{success}</p> : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { YIKE_COINS_BALANCE_CHANGED_EVENT } from "@/lib/yike-coins/balance-events";
import { ArrowRight, Search, UserRound } from "lucide-react";
import { formatYc } from "@/lib/yike-coins/constants";
import { YcAmount } from "@/components/yike-coins/yc-amount";
import { dispatchYikeCoinsBalanceChanged } from "@/lib/yike-coins/balance-events";
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

  useEffect(() => {
    setBalance(balanceCoins);
  }, [balanceCoins]);

  useEffect(() => {
    async function syncBalance() {
      try {
        const res = await fetch("/api/yike-coins/balance", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { balanceCoins?: number };
        setBalance(Number(json.balanceCoins ?? 0));
      } catch {
        /* keep last known */
      }
    }
    const onRefresh = () => void syncBalance();
    window.addEventListener(YIKE_COINS_BALANCE_CHANGED_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener(YIKE_COINS_BALANCE_CHANGED_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, []);

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
      dispatchYikeCoinsBalanceChanged();
      setSuccess(
        json.alreadyApplied
          ? "Transfer already recorded."
          : `Sent ${formatYc(amountInt)} to @${preview.username}.`,
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
      <div className="rounded-2xl border border-gold/30 bg-gold/5 px-4 py-4 text-sm text-navy/80">
        <p className="font-bold text-navy">Username required</p>
        <p className="mt-1 text-xs leading-relaxed">
          Claim a username above before you can send YC to other members.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs text-navy/60">
        Available:{" "}
        <YcAmount amount={balance} className="font-black text-navy" />
      </p>

      <div className="mt-4 space-y-2">
        <label htmlFor="yc-recipient" className="text-xs font-bold text-navy">
          Recipient username
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-navy/40">
              @
            </span>
            <input
              id="yc-recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.replace(/^@/, ""))}
              placeholder="ada_enugu"
              className="min-h-[48px] w-full rounded-xl border border-navy/15 bg-surface/30 pl-8 pr-3 text-sm text-navy outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={() => void lookup()}
            disabled={lookingUp || recipient.trim().length < 3}
            className="pressable flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-navy/15 bg-white px-4 text-sm font-bold text-navy disabled:opacity-50 sm:shrink-0"
          >
            <Search className="h-4 w-4" aria-hidden />
            {lookingUp ? "Checking…" : "Find user"}
          </button>
        </div>
        {lookupError ? (
          <p className="text-xs font-medium text-red-700" role="alert">
            {lookupError}
          </p>
        ) : null}
      </div>

      {preview ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-navy/10 bg-surface/50 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
            <UserRound className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-navy">{preview.displayName}</p>
            <p className="text-xs text-muted">@{preview.username}</p>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="mt-4 space-y-2">
          <label htmlFor="yc-amount" className="text-xs font-bold text-navy">
            Amount (YC)
          </label>
          <input
            id="yc-amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            className="min-h-[48px] w-full rounded-xl border border-navy/15 bg-surface/30 px-3 text-sm tabular-nums outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            placeholder="0"
          />
          {amountInt > balance ? (
            <p className="text-xs font-medium text-red-700" role="alert">
              Insufficient balance
            </p>
          ) : null}
          <button
            type="button"
            disabled={sending || amountInt <= 0 || amountInt > balance}
            onClick={() => void send()}
            className="pressable yike-btn-accent mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-navy text-sm font-bold text-white disabled:opacity-50"
          >
            {sending ? "Sending…" : "Confirm send"}
            {!sending && amountInt > 0 ? (
              <>
                <ArrowRight className="h-4 w-4" aria-hidden />
                <span className="text-gold">{formatYc(amountInt)}</span>
              </>
            ) : null}
          </button>
        </div>
      ) : null}

      {transferError ? (
        <p className="mt-3 text-xs font-medium text-red-700" role="alert">
          {transferError}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-xs font-medium text-emerald-800" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}

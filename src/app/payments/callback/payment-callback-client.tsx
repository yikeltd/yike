"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type PaymentCallbackPhase,
  mapVerifyHttpToPhase,
  reconcileHttpIndicatesUnavailable,
  shouldAttemptReconcile,
} from "@/lib/payments/callback-flow";
import { dispatchYikeCoinsBalanceChanged } from "@/lib/yike-coins/balance-events";
import { walletPath } from "@/lib/navigation/account-routes";

/**
 * Callback after Paystack Checkout.
 * Never treats redirect query params as proof of payment — polls server status and
 * optionally triggers owner reconcile (Paystack API verify + idempotent fulfilment).
 */
export function PaymentCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";

  const [phase, setPhase] = useState<PaymentCallbackPhase>(
    reference ? "processing" : "missing",
  );
  const [pollCount, setPollCount] = useState(0);
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const pollIndexRef = useRef(0);

  useEffect(() => {
    if (!reference) return;
    cancelledRef.current = false;
    pollIndexRef.current = 0;

    async function tryReconcile(): Promise<"ok" | "pending" | "unavailable" | "failed"> {
      try {
        const res = await fetch("/api/payments/reconcile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
          cache: "no-store",
        });
        const json = (await res.json()) as {
          ok?: boolean;
          error?: string;
          code?: string;
          walletTopup?: { balanceAfter?: number | null; coinsCredited?: number | null };
        };

        if (cancelledRef.current) return "pending";

        if (res.ok && json.ok) {
          dispatchYikeCoinsBalanceChanged();
          return "ok";
        }

        if (res.status === 202 || json.code === "pending") {
          return "pending";
        }

        if (res.status === 401 || res.status === 403) {
          setStatusHint("Sign in to confirm this payment and update your wallet.");
          return "pending";
        }

        if (reconcileHttpIndicatesUnavailable(res.status, json.code)) {
          return "unavailable";
        }

        if (json.code === "failed" || res.status === 400) {
          return "failed";
        }

        return "pending";
      } catch {
        return "unavailable";
      }
    }

    async function poll() {
      pollIndexRef.current += 1;
      const pollIndex = pollIndexRef.current;

      try {
        const res = await fetch(
          `/api/payments/verify/${encodeURIComponent(reference)}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as {
          ok?: boolean;
          status?: string;
          error?: string;
          code?: string;
        };

        if (cancelledRef.current) return;

        const mapped = mapVerifyHttpToPhase(res.status, data);
        if (mapped === "failed" || mapped === "cancelled") {
          setPhase(mapped);
          if (mapped === "failed") {
            router.replace(`/payments/failed?reference=${encodeURIComponent(reference)}`);
          } else {
            router.replace(`/payments/cancelled?reference=${encodeURIComponent(reference)}`);
          }
          return;
        }

        if (mapped === "verification_unavailable") {
          setPhase("verification_unavailable");
          setStatusHint(data.error ?? "Payment verification is temporarily unavailable.");
          return;
        }

        const status = data.status;
        const reconcileNow =
          status === "successful" || shouldAttemptReconcile(pollIndex);

        if (reconcileNow) {
          const outcome = await tryReconcile();
          if (cancelledRef.current) return;

          if (outcome === "ok") {
            router.replace(`/payments/success?reference=${encodeURIComponent(reference)}`);
            return;
          }
          if (outcome === "unavailable") {
            setPhase("verification_unavailable");
            setStatusHint(
              "We could not reach Paystack to verify this payment. Your wallet will update once verification succeeds.",
            );
            return;
          }
          if (outcome === "failed") {
            setPhase("failed");
            router.replace(`/payments/failed?reference=${encodeURIComponent(reference)}`);
            return;
          }
        }

        setPhase("processing");
      } catch {
        if (!cancelledRef.current) {
          setPhase("processing");
          setStatusHint("Network error while checking payment status. Retrying…");
        }
      }
    }

    void poll();
    const interval = window.setInterval(() => {
      setPollCount((n) => n + 1);
      void poll();
    }, 2500);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(interval);
    };
  }, [reference, router]);

  if (phase === "missing") {
    return (
      <StatusCard
        title="Missing payment reference"
        body="Return to your wallet and try again."
        href={walletPath()}
        cta="Yike Coins wallet"
      />
    );
  }

  if (phase === "verification_unavailable") {
    return (
      <StatusCard
        title="Verification unavailable"
        body={
          statusHint ??
          "We could not verify this payment right now. No Yike Coins were added until verification succeeds."
        }
        href={walletPath()}
        cta="Open wallet"
        secondaryHref="/payments/history"
        secondaryCta="Payment history"
        reference={reference}
      />
    );
  }

  if (phase === "failed") {
    return (
      <StatusCard
        title="Payment failed"
        body="This payment was not confirmed. You were not charged for Yike Coins."
        href={walletPath()}
        cta="Back to wallet"
        reference={reference}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-navy/20 border-t-gold"
          aria-hidden
        />
        <h1 className="text-xl font-bold text-navy">Processing…</h1>
        <p className="mt-2 text-sm text-muted">
          Confirming your payment securely with Paystack. Yike Coins are credited only after
          server verification — not from this redirect alone.
        </p>
        {statusHint ? <p className="mt-2 text-xs text-amber-800">{statusHint}</p> : null}
        {reference ? (
          <p className="mt-4 text-xs text-muted">
            Reference: <span className="font-mono text-navy">{reference}</span>
          </p>
        ) : null}
        {pollCount > 12 ? (
          <p className="mt-4 text-xs text-muted">
            Still waiting for confirmation. You can open your wallet and tap Refresh after a
            minute, or check payment history below.
          </p>
        ) : null}
        <Link
          href={walletPath()}
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white"
        >
          Yike Coins wallet
        </Link>
        <Link
          href="/payments/history"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-navy"
        >
          Payment history
        </Link>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  body,
  href,
  cta,
  secondaryHref,
  secondaryCta,
  reference,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
  reference?: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-navy">{title}</h1>
        <p className="mt-2 text-sm text-muted">{body}</p>
        {reference ? (
          <p className="mt-4 text-xs text-muted">
            Reference: <span className="font-mono text-navy">{reference}</span>
          </p>
        ) : null}
        <Link
          href={href}
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white"
        >
          {cta}
        </Link>
        {secondaryHref && secondaryCta ? (
          <Link
            href={secondaryHref}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border bg-white px-5 py-3 text-sm font-semibold text-navy"
          >
            {secondaryCta}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

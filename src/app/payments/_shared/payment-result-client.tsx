"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { dispatchYikeCoinsBalanceChanged } from "@/lib/yike-coins/balance-events";
import { walletPath } from "@/lib/navigation/account-routes";

type ReconcileState =
  | { phase: "idle" }
  | { phase: "working" }
  | { phase: "done"; walletCoins?: number | null; error?: string };

export function PaymentResultClient({
  variant,
}: {
  variant: "success" | "failed" | "cancelled";
}) {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";

  const [reconcile, setReconcile] = useState<ReconcileState>({ phase: "idle" });

  useEffect(() => {
    if (variant !== "success" || !reference) return;
    let cancelled = false;
    void (async () => {
      setReconcile({ phase: "working" });
      try {
        const res = await fetch("/api/payments/reconcile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (res.ok) {
          dispatchYikeCoinsBalanceChanged();
          setReconcile({
            phase: "done",
            walletCoins: json.walletTopup?.coinsCredited ?? null,
          });
          return;
        }
        if (res.status === 202) {
          setReconcile({
            phase: "done",
            error: "Payment is still processing. Your wallet will update shortly.",
          });
          return;
        }
        setReconcile({
          phase: "done",
          error: json.error ?? "Could not confirm payment yet.",
        });
      } catch {
        if (!cancelled) {
          setReconcile({ phase: "done", error: "Could not reach payment verification." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variant, reference]);

  const copy =
    variant === "success"
      ? {
          title: "Payment successful",
          body:
            reconcile.phase === "working"
              ? "Verifying with Paystack and updating your wallet…"
              : reconcile.phase === "done" && reconcile.walletCoins != null
                ? `Added ${reconcile.walletCoins} Yike Coins to your wallet.`
                : reconcile.phase === "done" && reconcile.error
                  ? reconcile.error
                  : "Your payment is confirmed. Eligible products will activate shortly.",
          cta: "Yike Coins wallet",
          href: walletPath(),
          secondary: "Payment history",
          secondaryHref: "/payments/history",
          tone: "border-gold/30 bg-gold/5",
        }
      : variant === "failed"
        ? {
            title: "Payment failed",
            body: "We could not confirm this payment. No charge was completed, or the bank declined it. You can try again.",
            cta: "Yike Coins wallet",
            href: walletPath(),
            secondary: "Payment history",
            secondaryHref: "/payments/history",
            tone: "border-border bg-white",
          }
        : {
            title: "Payment cancelled",
            body: "You left checkout before finishing. Nothing was charged.",
            cta: "Yike Coins wallet",
            href: walletPath(),
            secondary: "Browse listings",
            secondaryHref: "/discover",
            tone: "border-border bg-white",
          };

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col justify-center px-4 py-12">
      <div className={`rounded-2xl border p-8 text-center shadow-sm ${copy.tone}`}>
        <h1 className="text-xl font-bold text-navy">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted">{copy.body}</p>
        {reference ? (
          <p className="mt-4 text-xs text-muted">
            Reference: <span className="font-mono text-navy">{reference}</span>
          </p>
        ) : null}
        <Link
          href={copy.href}
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gold py-3 text-sm font-bold text-navy"
        >
          {copy.cta}
        </Link>
        <Link
          href={copy.secondaryHref}
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border bg-white py-3 text-sm font-semibold text-navy"
        >
          {copy.secondary}
        </Link>
      </div>
    </div>
  );
}

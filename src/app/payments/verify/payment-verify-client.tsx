"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type VerifyState =
  | { phase: "loading" }
  | {
      phase: "success";
      orderType: string;
      featuredUntil: string | null;
      boostedUntil: string | null;
      alreadyFulfilled: boolean;
    }
  | { phase: "pending" }
  | { phase: "error"; message: string };

function formatFeaturedUntil(iso: string | null): string {
  if (!iso) return "the end of your promotion period";
  return new Date(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PaymentVerifyClient() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";

  const [state, setState] = useState<VerifyState>(
    reference ? { phase: "loading" } : { phase: "error", message: "Missing payment reference" }
  );

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;

    async function verify() {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        code?: string;
        orderType?: string;
        featuredUntil?: string | null;
        boostedUntil?: string | null;
        alreadyFulfilled?: boolean;
      };

      if (cancelled) return;

      if (res.status === 202 || data.code === "pending") {
        setState({ phase: "pending" });
        return;
      }

      if (!res.ok || !data.ok) {
        setState({
          phase: "error",
          message: data.error ?? "We could not confirm this payment yet.",
        });
        return;
      }

      setState({
        phase: "success",
        orderType: data.orderType ?? "featured_listing",
        featuredUntil: data.featuredUntil ?? null,
        boostedUntil: data.boostedUntil ?? null,
        alreadyFulfilled: Boolean(data.alreadyFulfilled),
      });
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col justify-center px-4 py-12">
      {state.phase === "loading" ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-muted">Confirming your payment…</p>
        </div>
      ) : null}

      {state.phase === "pending" ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-navy">Payment processing</h1>
          <p className="mt-2 text-sm text-muted">
            Your bank is still confirming this payment. Refresh in a moment or check My listings.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white"
          >
            Refresh
          </button>
        </div>
      ) : null}

      {state.phase === "success" ? (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-navy">
            {state.orderType === "boost_listing"
              ? "Boost activated"
              : "Featured listing activated"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {state.orderType === "boost_listing"
              ? "Your listing will rank higher in search until:"
              : "Your listing will receive priority visibility until:"}
          </p>
          <p className="mt-1 text-base font-semibold text-navy">
            {formatFeaturedUntil(
              state.orderType === "boost_listing"
                ? state.boostedUntil
                : state.featuredUntil
            )}
          </p>
          {state.alreadyFulfilled ? (
            <p className="mt-2 text-xs text-muted">This promotion was already active.</p>
          ) : null}
          <Link
            href="/agent/listings"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gold py-3 text-sm font-bold text-navy"
          >
            Back to listings
          </Link>
        </div>
      ) : null}

      {state.phase === "error" ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-navy">Payment not confirmed</h1>
          <p className="mt-2 text-sm text-muted">{state.message}</p>
          <Link
            href="/agent/listings"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-navy py-3 text-sm font-bold text-white"
          >
            Back to listings
          </Link>
        </div>
      ) : null}
    </div>
  );
}

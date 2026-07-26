"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Phase = "processing" | "successful" | "failed" | "cancelled" | "missing";

function mapStatus(status: string): Phase {
  if (status === "successful") return "successful";
  if (status === "failed") return "failed";
  if (status === "cancelled" || status === "refunded") return "cancelled";
  return "processing";
}

/**
 * Callback after Paystack Checkout.
 * Shows Processing only and polls status — never activates from this page.
 */
export function PaymentCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";

  const [phase, setPhase] = useState<Phase>(reference ? "processing" : "missing");
  const [pollCount, setPollCount] = useState(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!reference) return;
    cancelledRef.current = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/payments/verify/${encodeURIComponent(reference)}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as {
          ok?: boolean;
          status?: string;
          error?: string;
        };

        if (cancelledRef.current) return;

        if (!res.ok || !data.ok || !data.status) {
          // Keep processing while webhook may still arrive
          setPhase("processing");
          return;
        }

        const next = mapStatus(data.status);
        setPhase(next);

        if (next === "successful") {
          router.replace(`/payments/success?reference=${encodeURIComponent(reference)}`);
          return;
        }
        if (next === "failed") {
          router.replace(`/payments/failed?reference=${encodeURIComponent(reference)}`);
          return;
        }
        if (next === "cancelled") {
          router.replace(`/payments/cancelled?reference=${encodeURIComponent(reference)}`);
        }
      } catch {
        if (!cancelledRef.current) setPhase("processing");
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
        body="Return to your listings and try again."
        href="/agent/listings"
        cta="Back to listings"
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
          Confirming your payment securely. This usually takes a few seconds.
        </p>
        {reference ? (
          <p className="mt-4 text-xs text-muted">
            Reference: <span className="font-mono text-navy">{reference}</span>
          </p>
        ) : null}
        {pollCount > 12 ? (
          <p className="mt-4 text-xs text-muted">
            Still waiting for confirmation. You can leave this page — we&apos;ll email you when it
            completes.
          </p>
        ) : null}
        <Link
          href="/payments/history"
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white"
        >
          View payment history
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
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-navy">{title}</h1>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <Link
          href={href}
          className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

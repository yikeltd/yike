"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

  const copy =
    variant === "success"
      ? {
          title: "Payment successful",
          body: "Your payment is confirmed. Your boost, feature, or plan will appear shortly.",
          cta: "View payment history",
          href: "/payments/history",
          secondary: "Back to listings",
          secondaryHref: "/agent/listings",
          tone: "border-gold/30 bg-gold/5",
        }
      : variant === "failed"
        ? {
            title: "Payment failed",
            body: "We could not confirm this payment. No charge was completed, or the bank declined it. You can try again.",
            cta: "Back to listings",
            href: "/agent/listings",
            secondary: "Payment history",
            secondaryHref: "/payments/history",
            tone: "border-border bg-white",
          }
        : {
            title: "Payment cancelled",
            body: "You left checkout before finishing. Nothing was charged.",
            cta: "Back to listings",
            href: "/agent/listings",
            secondary: "Payment history",
            secondaryHref: "/payments/history",
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

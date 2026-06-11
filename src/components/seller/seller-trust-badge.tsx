"use client";

import { useState } from "react";
import { BadgeCheck, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SELLER_VERIFICATION_COPY } from "@/lib/seller-verification/constants";
import type { SellerTrustLevel } from "@/lib/seller-verification/levels";

function SellerVerificationModal({
  open,
  onClose,
  level,
}: {
  open: boolean;
  onClose: () => void;
  level: "basic" | "business";
}) {
  if (!open) return null;

  const label =
    level === "business"
      ? SELLER_VERIFICATION_COPY.businessLabel
      : SELLER_VERIFICATION_COPY.verifiedLabel;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-verification-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-float-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              {label}
            </p>
            <h2 id="seller-verification-title" className="mt-1 text-lg font-bold text-navy">
              {SELLER_VERIFICATION_COPY.explainerTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted pressable"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {SELLER_VERIFICATION_COPY.explainerBody}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white pressable"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function SellerTrustBadge({
  level,
  size = "sm",
  className,
}: {
  level: SellerTrustLevel;
  size?: "sm" | "md";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (level === "none") return null;

  const isBusiness = level === "business";
  const label = isBusiness
    ? SELLER_VERIFICATION_COPY.businessLabel
    : SELLER_VERIFICATION_COPY.verifiedLabel;
  const Icon = isBusiness ? ShieldCheck : BadgeCheck;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full font-semibold pressable",
          isBusiness
            ? "border border-gold/40 bg-gold/10 text-navy"
            : "border border-navy/10 bg-surface text-navy/80",
          size === "sm"
            ? "px-1.5 py-0.5 text-[10px] leading-none"
            : "px-2 py-0.5 text-xs",
          className
        )}
        aria-label={`${label}. ${SELLER_VERIFICATION_COPY.explainerBody}`}
      >
        <Icon
          className={cn(
            isBusiness ? "text-gold-dark" : "text-navy/60",
            size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"
          )}
          strokeWidth={2.5}
        />
        {label}
      </button>
      <SellerVerificationModal
        open={open}
        onClose={() => setOpen(false)}
        level={isBusiness ? "business" : "basic"}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import {
  PROPERTY_PHYSICALLY_VERIFIED_LABEL,
  PROPERTY_VERIFICATION_SAFETY_COPY,
} from "@/lib/property-verification/packages";
import { cn } from "@/lib/utils";

export function PropertyPhysicallyVerifiedBadge({
  verifiedAt,
  className,
  size = "md",
}: {
  verifiedAt?: string | null;
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const dateLabel = verifiedAt
    ? new Date(verifiedAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 font-semibold text-emerald-900 pressable",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          className
        )}
      >
        <ShieldCheck className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
        {PROPERTY_PHYSICALLY_VERIFIED_LABEL}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-float-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">{PROPERTY_PHYSICALLY_VERIFIED_LABEL}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            {dateLabel ? (
              <p className="mt-2 text-sm text-muted">
                Verification date: <span className="font-semibold text-navy">{dateLabel}</span>
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {PROPERTY_VERIFICATION_SAFETY_COPY}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function PropertyPhysicallyVerifiedCard({
  verifiedAt,
}: {
  verifiedAt?: string | null;
}) {
  if (!verifiedAt) return null;

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4">
      <PropertyPhysicallyVerifiedBadge verifiedAt={verifiedAt} size="md" />
      <p className="mt-2 text-xs text-muted">
        Verification date:{" "}
        {new Date(verifiedAt).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {PROPERTY_VERIFICATION_SAFETY_COPY}
      </p>
    </div>
  );
}

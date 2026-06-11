"use client";

import { useState } from "react";
import { useRevenueCatalog } from "@/hooks/use-revenue-catalog";
import { getCatalogPrice } from "@/lib/revenue-pricing/catalog-utils";
import { DEFAULT_REVENUE_PRICING } from "@/lib/revenue-pricing/defaults";
import { Check, Globe2, ShieldCheck } from "lucide-react";
import {
  PROPERTY_VERIFICATION_PACKAGES,
  PROPERTY_VERIFICATION_SAFETY_COPY,
  type PropertyVerificationPackageId,
} from "@/lib/property-verification/packages";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PropertyVerificationPackages({
  requestId,
  reference,
  diaspora,
}: {
  requestId: string;
  reference?: string;
  diaspora?: boolean;
}) {
  const [busy, setBusy] = useState<PropertyVerificationPackageId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const catalog = useRevenueCatalog();

  function packagePrice(id: PropertyVerificationPackageId): number {
    return (
      getCatalogPrice(catalog, "property_verification", id) ??
      DEFAULT_REVENUE_PRICING.find(
        (i) => i.product === "property_verification" && i.variant_key === id
      )?.amount ??
      0
    );
  }

  async function choosePackage(packageType: PropertyVerificationPackageId) {
    setBusy(packageType);
    setError(null);
    const res = await fetch("/api/property-verification/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, packageType }),
    });
    const data = (await res.json()) as {
      authorizationUrl?: string;
      verificationReference?: string;
      error?: string;
    };
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not start checkout");
      return;
    }
    if (data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
      return;
    }
    window.location.href = `/property-verification/requests/${requestId}?paid=1&ref=${encodeURIComponent(data.verificationReference ?? reference ?? "")}`;
  }

  return (
    <div className="space-y-6">
      {diaspora ? (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
          <div className="flex items-start gap-3">
            <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
            <div>
              <p className="font-bold text-navy">Diaspora & remote buyers</p>
              <p className="mt-1 text-sm text-muted">
                Outside Nigeria, already sent money, unable to inspect, or urgent relocation —
                Premium includes priority handling when inspectors are available.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-sm leading-relaxed text-muted">{PROPERTY_VERIFICATION_SAFETY_COPY}</p>

      <div className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(PROPERTY_VERIFICATION_PACKAGES) as PropertyVerificationPackageId[]).map(
          (id) => {
            const pkg = PROPERTY_VERIFICATION_PACKAGES[id];
            return (
              <article
                key={id}
                className={cn(
                  "flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
                  pkg.highlighted ? "border-gold ring-2 ring-gold/20" : "border-border"
                )}
              >
                {pkg.highlighted ? (
                  <span className="mb-2 w-fit rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                    Most popular
                  </span>
                ) : null}
                <h2 className="text-lg font-bold text-navy">{pkg.label}</h2>
                <p className="mt-1 text-2xl font-bold tabular-nums text-navy">
                  {formatPrice(packagePrice(id), "total", "rent")}
                </p>
                <p className="mt-1 text-xs text-muted">SLA: {pkg.sla}</p>
                <p className="mt-2 text-xs font-semibold text-gold-dark">{pkg.target}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-navy">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void choosePackage(id)}
                  className={cn(
                    "mt-5 w-full rounded-xl py-3 text-sm font-bold pressable",
                    pkg.highlighted
                      ? "bg-gold text-navy"
                      : "bg-navy text-white",
                    busy === id && "opacity-60"
                  )}
                >
                  {busy === id ? "Processing…" : `Choose ${pkg.label}`}
                </button>
              </article>
            );
          }
        )}
      </div>

      {reference ? (
        <p className="text-center text-xs text-muted">
          Request reference: <span className="font-semibold text-navy">{reference}</span>
        </p>
      ) : null}

      {error ? <p className="text-center text-sm text-danger">{error}</p> : null}

      <div className="flex items-start gap-2 rounded-xl bg-surface px-4 py-3 text-xs text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
        <span>{PROPERTY_VERIFICATION_SAFETY_COPY}</span>
      </div>
    </div>
  );
}

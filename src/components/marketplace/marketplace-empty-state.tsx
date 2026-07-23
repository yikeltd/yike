import Link from "next/link";
import { cn } from "@/lib/utils";

export function MarketplaceEmptyState({
  title,
  subtitle,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
  className,
}: {
  title: string;
  subtitle?: string;
  actionHref: string;
  actionLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-navy/12 bg-white/80 px-5 py-8 text-center sm:px-6",
        className,
      )}
    >
      <p className="text-base font-bold tracking-tight text-navy sm:text-lg">
        {title}
      </p>
      {subtitle ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-navy/50">{subtitle}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={actionHref}
          className="pressable inline-flex rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy shadow-sm transition-transform hover:brightness-105"
        >
          {actionLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="pressable inline-flex rounded-xl border border-navy/12 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-gold/40 hover:bg-gold/10"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Thin/empty city inventory — short copy only.
 * Prefer silent nearby auto-load when inventory exists elsewhere.
 */
export function LocationThinEmptyState({
  city,
  state,
  category,
  className,
}: {
  city?: string | null;
  state?: string | null;
  category: "property" | "vehicle";
  className?: string;
}) {
  const browseHref = category === "vehicle" ? "/vehicles" : "/search";
  const title = city
    ? `No listings in ${city} yet.`
    : "No listings here yet.";

  const nearbyHref = state
    ? `${browseHref}?state=${encodeURIComponent(state)}`
    : browseHref;

  return (
    <MarketplaceEmptyState
      title={title}
      subtitle={city ? "Showing nearby listings." : undefined}
      actionHref={nearbyHref}
      actionLabel={state ? `Nearby · ${state}` : "Browse"}
      secondaryHref={browseHref}
      secondaryLabel="Across Nigeria"
      className={cn("py-6 sm:py-8", className)}
    />
  );
}

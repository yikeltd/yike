import Link from "next/link";

/** Compact empty state for submitted browse — no SEO chip rails. */
export function MarketplaceSubmittedEmpty({
  title,
  subtitle,
  clearHref,
  clearLabel = "Clear filters",
}: {
  title: string;
  subtitle: string;
  clearHref: string;
  clearLabel?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-dashed border-navy/15 bg-white p-6 text-center sm:p-8"
      data-testid="marketplace-submitted-empty"
    >
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
      <Link
        href={clearHref}
        className="pressable mt-4 inline-block text-sm font-semibold text-gold"
      >
        {clearLabel}
      </Link>
    </div>
  );
}

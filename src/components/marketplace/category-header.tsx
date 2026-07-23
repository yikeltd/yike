import Link from "next/link";
import { SaveSearchButton } from "@/components/search/save-search-button";
import { MarketplaceVerticalSwitcher } from "@/components/marketplace/vertical-switcher";
import { cn } from "@/lib/utils";

export type MarketplaceCategoryHeaderProps = {
  vertical: "property" | "vehicle";
  title: string;
  tagline: string;
  sellHref: string;
  sellLabel: string;
  saveLabel?: string;
  saveHref?: string;
  className?: string;
};

/** Compact category page chrome — title, tagline, Save Search + Sell. */
export function MarketplaceCategoryHeader({
  vertical,
  title,
  tagline,
  sellHref,
  sellLabel,
  saveLabel,
  saveHref,
  className,
}: MarketplaceCategoryHeaderProps) {
  return (
    <header className={cn("mb-5", className)}>
      <MarketplaceVerticalSwitcher active={vertical} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-navy lg:text-4xl">
            {title}
          </h1>
          <p className="mt-1 text-base text-navy/55">{tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveHref && saveLabel ? (
            <SaveSearchButton
              label={saveLabel}
              href={saveHref}
              className="!rounded-xl !bg-white !px-4 !py-2.5 !text-sm !font-semibold !text-navy !ring-1 !ring-navy/12"
            />
          ) : null}
          <Link
            href={sellHref}
            className="pressable inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy shadow-sm"
          >
            {sellLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

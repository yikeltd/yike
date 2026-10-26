import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatListingPublicLocation(parts: {
  area?: string | null;
  city?: string | null;
  state?: string | null;
}): string {
  return [parts.area, parts.city, parts.state].filter(Boolean).join(", ");
}

type Props = {
  locationLabel: string;
  title?: string;
  className?: string;
};

/** Compact location block — no map imagery or coordinates. */
export function ListingDetailLocationSection({
  locationLabel,
  title = "Location & Neighborhood",
  className,
}: Props) {
  const label = locationLabel.trim();
  if (!label) return null;

  return (
    <section
      className={cn(
        "rounded-2xl border border-navy/10 bg-white px-4 py-3.5 shadow-sm dark:border-white/10 dark:bg-navy sm:px-5 sm:py-4",
        className,
      )}
      data-testid="listing-detail-location-section"
      aria-label={title}
    >
      <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-navy/70 dark:text-white/70">
        <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />
        {title}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-snug text-navy dark:text-white">
        {label}
      </p>
    </section>
  );
}

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListingDetailPanel, ListingDetailSectionHeading } from "./listing-detail-panel";

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
    <ListingDetailPanel
      className={cn(className)}
      data-testid="listing-detail-location-section"
      aria-label={title}
    >
      <ListingDetailSectionHeading
        title={title}
        className="mb-2"
        leadingIcon={<MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />}
      />
      <p className="text-sm font-semibold leading-snug text-navy dark:text-white">{label}</p>
    </ListingDetailPanel>
  );
}

import Link from "next/link";
import type { HomeHotspot } from "@/lib/home-hotspots";
import { formatPrice, listingTypeLabel } from "@/lib/utils";
import { listingImageAlt } from "@/lib/image-seo";
import { ListingImage } from "@/components/property/listing-image";
import { Flame, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeSpotlightCard({
  hotspot,
  priority,
}: {
  hotspot: HomeHotspot;
  priority?: boolean;
}) {
  const { property, headline, badge } = hotspot;
  const image = property.media_urls[0] ?? "/placeholder-property.svg";
  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );

  return (
    <Link
      href={`/properties/${property.id}`}
      className={cn(
        "group relative block min-w-[min(78vw,280px)] shrink-0 overflow-hidden rounded-2xl",
        "ring-1 ring-gold/20 transition-all duration-300",
        "hover:-translate-y-1 hover:ring-gold/45 hover:shadow-glow-gold",
        "lg:min-w-0 lg:flex-1"
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-navy-dark">
        <ListingImage
          src={image}
          alt={listingImageAlt(property)}
          priority={priority}
          sizes="(max-width: 1024px) 78vw, 360px"
          width={720}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/25 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy">
          <Flame className="h-3 w-3" />
          {badge}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gold-light">
            {listingTypeLabel(property.listing_type)}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-white">{price}</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-white/95">
            {headline}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-xs text-white/70">
            <MapPin className="h-3 w-3 text-gold" />
            {property.area}, {property.city}
          </p>
        </div>
      </div>
    </Link>
  );
}

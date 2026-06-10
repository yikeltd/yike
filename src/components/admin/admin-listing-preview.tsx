import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { normalizePropertyMedia } from "@/lib/media/items";
import type { Property, Profile } from "@/types/database";
import { StatusBadge } from "@/components/ui/badge";

export function AdminListingPreview({
  listing,
}: {
  listing: Property & { agent?: Profile | null };
}) {
  const media = normalizePropertyMedia(listing);
  const cover = media[0];
  const coverUrl =
    cover?.webp_url || cover?.image_url || cover?.thumbnail_url || listing.media_urls[0];

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Listing preview</p>
          <h2 className="text-lg font-bold text-navy">{listing.title}</h2>
          <p className="mt-1 text-sm font-bold text-navy">
            {formatPrice(Number(listing.price), listing.payment_period, listing.listing_type)}
          </p>
          <p className="text-sm text-muted">
            {listing.area}, {listing.city}, {listing.state}
          </p>
          {listing.agent?.full_name ? (
            <p className="mt-1 text-xs text-muted">Agent: {listing.agent.full_name}</p>
          ) : null}
        </div>
        <StatusBadge status={listing.status} />
      </div>

      {coverUrl ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface">
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            unoptimized={coverUrl.startsWith("http")}
            priority
          />
        </div>
      ) : null}

      {media.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.slice(0, 8).map((item) => {
            const url = item.webp_url || item.image_url || item.thumbnail_url;
            if (!url) return null;
            return (
              <div
                key={item.id}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized={url.startsWith("http")}
                />
              </div>
            );
          })}
        </div>
      ) : null}

      {listing.description ? (
        <p className="text-sm text-navy/85 whitespace-pre-wrap">{listing.description}</p>
      ) : (
        <p className="text-sm text-muted">No description.</p>
      )}

      {listing.status !== "approved" ? (
        <p className="text-xs text-muted">
          Public page is hidden until approved — review here in staff console.
        </p>
      ) : null}
    </section>
  );
}

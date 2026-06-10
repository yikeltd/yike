"use client";

import Image from "next/image";
import Link from "next/link";
import { ListingActions } from "./listing-actions";
import { StatusBadge } from "@/components/ui/badge";
import { formatPrice, isVerifiedAgent } from "@/lib/utils";
import {
  analyzeListingQuality,
  qualityFlagLabel,
} from "@/lib/listing-quality";
import { propertyPath } from "@/lib/property-url";
import type { Property, Profile } from "@/types/database";

export function ModerationCard({
  property,
}: {
  property: Property & { agent: Profile | null };
}) {
  const thumb = property.media_urls[0];
  const agent = property.agent;
  const flags = analyzeListingQuality(property);

  const pubHref = propertyPath(property);
  const editHref = `/lex/auth/listings/${property.id}`;

  return (
    <li className="overflow-hidden rounded-2xl bg-elevated shadow-float">
      <div className="flex gap-3 p-3">
        <Link
          href={editHref}
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface"
        >
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={thumb.startsWith("http")}
            />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-muted">
              No img
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={editHref} className="line-clamp-2 font-bold text-foreground">
              {property.title}
            </Link>
            <StatusBadge status={property.status} />
          </div>
          {property.status === "approved" ? (
            <Link href={pubHref} className="text-[10px] text-gold-dark" target="_blank" rel="noopener noreferrer">
              {property.slug ?? "View public"}
            </Link>
          ) : (
            <span className="text-[10px] text-muted">Pending — staff preview only</span>
          )}
          <p className="mt-1 text-lg font-bold text-navy">
            {formatPrice(
              Number(property.price),
              property.payment_period,
              property.listing_type
            )}
          </p>
          <p className="text-sm text-muted">
            {property.area}, {property.city}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {agent?.full_name ?? "Unknown agent"}
          </p>
          {property.review_overall_score != null && (
            <p className="mt-1 text-xs font-bold text-navy">
              Review {property.review_overall_score}/100
              {property.review_risk_level
                ? ` · ${property.review_risk_level} risk`
                : ""}
            </p>
          )}
          {flags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {flags.map((flag) => (
                <span
                  key={flag}
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900"
                >
                  {qualityFlagLabel(flag)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-surface px-3 py-3">
        <ListingActions
          propertyId={property.id}
          agentVerified={
            agent ? isVerifiedAgent(agent) : false
          }
        />
      </div>
    </li>
  );
}

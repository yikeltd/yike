"use client";

import Link from "next/link";
import { ListingImage } from "@/components/property/listing-image";

export function ListingThumbCard({
  href,
  title,
  image,
  subtitle,
  priority,
}: {
  href: string;
  title: string;
  image: string;
  subtitle?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className="pressable flex w-36 shrink-0 flex-col overflow-hidden rounded-xl bg-elevated shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
    >
      <div className="relative aspect-[4/3] bg-surface">
        <ListingImage
          src={image}
          alt={title}
          priority={priority}
          sizes="144px"
          width={320}
        />
      </div>
      <div className="p-2">
        <p className="line-clamp-1 text-[11px] font-bold text-foreground">{title}</p>
        {subtitle && (
          <p className="line-clamp-1 text-[10px] text-muted">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}

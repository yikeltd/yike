"use client";

import Link from "next/link";
import Image from "next/image";
import { optimizeListingImageUrl } from "@/lib/image-url";

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
  const src = image.startsWith("http")
    ? optimizeListingImageUrl(image, 400)
    : image;

  return (
    <Link
      href={href}
      className="pressable flex w-36 shrink-0 flex-col overflow-hidden rounded-xl bg-elevated shadow-float ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
    >
      <div className="relative aspect-[4/3] bg-surface">
        <Image
          src={src}
          alt=""
          fill
          sizes="144px"
          className="object-cover"
          priority={priority}
          loading={priority ? undefined : "lazy"}
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

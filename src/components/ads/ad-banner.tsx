import Image from "next/image";
import Link from "next/link";
import type { AdPlacement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { AD_PLACEMENT_META } from "@/constants/adPlacements";
import { cn } from "@/lib/utils";

export function AdBanner({
  ad,
  placementKey,
  className,
}: {
  ad: AdPlacement;
  placementKey: AdPlacementKey;
  className?: string;
}) {
  const meta = AD_PLACEMENT_META[placementKey];
  const imageUrl = ad.image_url!;
  const alt = ad.alt_text || ad.title || "Sponsored on Yike";
  const isStrip = meta.aspect === "strip";
  const isBanner = meta.aspect === "banner";

  const inner = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        isStrip && "rounded-xl",
        className
      )}
    >
      <span className="absolute left-3 top-3 z-10 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
        Sponsored
      </span>
      <div
        className={cn(
          "relative w-full",
          isStrip ? "aspect-[6/1] min-h-[56px]" : isBanner ? "aspect-[2.4/1]" : "aspect-[16/10]"
        )}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes={
            isStrip
              ? "100vw"
              : isBanner
                ? "(max-width: 768px) 100vw, 960px"
                : "(max-width: 768px) 100vw, 400px"
          }
          unoptimized={imageUrl.startsWith("http") && !imageUrl.includes("supabase")}
        />
      </div>
      {ad.title && (
        <p className="border-t border-surface px-3 py-2 text-xs font-semibold text-foreground">
          {ad.title}
        </p>
      )}
    </div>
  );

  if (ad.link_url) {
    return (
      <Link
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="pressable block"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}

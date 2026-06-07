"use client";

import Image from "next/image";
import { useState } from "react";
import { isPreOptimizedListingUrl, optimizeListingImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

export function ListingImage({
  src,
  alt,
  priority,
  sizes,
  className,
  width = 1200,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  width?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const optimized = optimizeListingImageUrl(src, width);
  const skipNextOptimize = isPreOptimizedListingUrl(optimized);

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface">
      {!loaded && (
        <div
          className="absolute inset-0 skeleton animate-pulse-soft"
          aria-hidden
        />
      )}
      <Image
        src={optimized}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes ?? "(max-width: 640px) 94vw, 420px"}
        className={cn(
          "object-cover object-center transition-[opacity,transform] duration-500 ease-out",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]",
          className
        )}
        loading={priority ? undefined : "lazy"}
        decoding="async"
        unoptimized={skipNextOptimize}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { getOnboardingAssetUrl } from "@/lib/onboarding/responsive-tokens";
import { cn } from "@/lib/utils";

type Props = {
  category: "cars" | "props";
  assetName: string;
  alt: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

/**
 * OnboardingResponsiveImage Component
 * Serves optimized 640x440 Retina WebP images with PNG fallback,
 * object-fit: contain, 0 CLS layout shift, and smooth loading transitions.
 */
export function OnboardingResponsiveImage({
  category,
  assetName,
  alt,
  priority = false,
  className,
  imageClassName,
}: Props) {
  const [useFallback, setUseFallback] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const srcUrl = getOnboardingAssetUrl(category, assetName, useFallback);

  return (
    <div
      className={cn(
        "relative w-full aspect-[16/11] overflow-hidden rounded-2xl bg-slate-50/80 flex items-center justify-center p-2",
        className
      )}
    >
      <Image
        src={srcUrl}
        alt={alt}
        width={640}
        height={440}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        onError={() => {
          if (!useFallback) {
            setUseFallback(true);
          }
        }}
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-contain object-center transition-all duration-300",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
          imageClassName
        )}
      />
    </div>
  );
}

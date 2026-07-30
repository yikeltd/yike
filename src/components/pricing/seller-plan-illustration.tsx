"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type PlanId = "core" | "pro" | "elite" | "prime";

type Props = {
  planId: PlanId | string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

const PLAN_ALT_LABELS: Record<string, string> = {
  core: "Core Seller Plan Illustration",
  pro: "Pro Seller Plan Illustration",
  elite: "Elite Seller Plan Illustration",
  prime: "Prime Seller Plan Illustration",
};

/**
 * SellerPlanIllustration Component
 * Delivers optimized Retina WebP illustrations with PNG fallback,
 * object-fit: contain, intrinsic dimensions, and 0 CLS layout shift.
 */
export function SellerPlanIllustration({
  planId,
  className,
  imageClassName,
  priority = false,
}: Props) {
  const [useFallback, setUseFallback] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cleanPlanId = String(planId).toLowerCase();
  const ext = useFallback ? "png" : "webp";
  const src = `/assets/seller-plan/${cleanPlanId}.${ext}`;
  const alt = PLAN_ALT_LABELS[cleanPlanId] ?? `${cleanPlanId} Seller Plan Illustration`;

  return (
    <div
      className={cn(
        "relative w-full aspect-[16/10] overflow-hidden rounded-2xl flex items-center justify-center p-2 bg-slate-50/50 select-none",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={640}
        height={400}
        priority={priority || cleanPlanId === "core" || cleanPlanId === "pro"}
        loading={priority || cleanPlanId === "core" || cleanPlanId === "pro" ? "eager" : "lazy"}
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

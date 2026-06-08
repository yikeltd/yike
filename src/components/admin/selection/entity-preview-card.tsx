"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { optimizeListingImageUrl } from "@/lib/image-url";
import type { AdminEntityItem } from "./types";

export function EntityPreviewCard({
  entity,
  compact,
  onClick,
  action,
  className,
}: {
  entity: AdminEntityItem;
  compact?: boolean;
  onClick?: () => void;
  action?: React.ReactNode;
  className?: string;
}) {
  const Wrapper = onClick ? "button" : "div";
  const imageSrc = entity.image_url
    ? entity.image_url.startsWith("http")
      ? optimizeListingImageUrl(entity.image_url, compact ? 120 : 200)
      : entity.image_url
    : null;

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border border-border bg-white text-left transition-colors",
        compact ? "p-2.5" : "p-3",
        onClick && "pressable hover:border-gold/50 hover:bg-elevated/50",
        className
      )}
    >
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg bg-navy/5",
          compact ? "h-12 w-12" : "h-16 w-16"
        )}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes={compact ? "48px" : "64px"}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-bold text-navy/40">
            {entity.display_name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span
            className={cn(
              "block truncate font-semibold text-navy",
              compact ? "text-sm" : "text-base"
            )}
          >
            {entity.display_name}
          </span>
          {entity.badge && (
            <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold-dark">
              {entity.badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {entity.subtitle}
        </span>
      </span>
      {action}
    </Wrapper>
  );
}

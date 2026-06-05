"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { MIN_LISTING_IMAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MediaPreviewGrid({
  urls,
  onRemove,
}: {
  urls: string[];
  onRemove: (url: string) => void;
}) {
  if (urls.length === 0) return null;

  const ready = urls.length >= MIN_LISTING_IMAGES;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Photos</p>
        <p
          className={cn(
            "text-xs font-semibold",
            ready ? "text-gold-dark" : "text-muted"
          )}
        >
          {urls.length}/{MIN_LISTING_IMAGES} min
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url) => (
          <div
            key={url}
            className="relative aspect-square overflow-hidden rounded-xl bg-surface shadow-float"
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover"
              sizes="120px"
              unoptimized={url.startsWith("http")}
            />
            <button
              type="button"
              onClick={() => onRemove(url)}
              className="pressable absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-navy/80 text-white"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

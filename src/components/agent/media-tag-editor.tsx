"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Star,
  X,
  Check,
} from "lucide-react";
import { MIN_LISTING_IMAGES } from "@/lib/constants";
import { ROOM_LABELS } from "@/lib/media/labels";
import type { PropertyMediaItem } from "@/lib/media/items";
import {
  applyDefaultLabels,
  displayUrl,
  reorderMediaItems,
  removeMediaItem,
  setCoverItem,
  sortMediaItemsForStory,
} from "@/lib/media/items";
import { cn } from "@/lib/utils";

type Props = {
  items: PropertyMediaItem[];
  onChange: (items: PropertyMediaItem[]) => void;
};

export function MediaTagEditor({ items, onChange }: Props) {
  if (items.length === 0) return null;

  const ready = items.length >= MIN_LISTING_IMAGES;

  function updateLabel(id: string, room_label: string) {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, room_label } : item
      )
    );
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    onChange(reorderMediaItems(items, from, to));
  }

  function confirmAllLabels() {
    onChange(sortMediaItemsForStory(applyDefaultLabels(items)));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground">Photo labels</p>
          <p className="text-xs text-muted">
            Helps swipe show a property story · tap confirm when done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-xs font-semibold",
              ready ? "text-gold-dark" : "text-muted"
            )}
          >
            {items.length}/{MIN_LISTING_IMAGES} min
          </p>
          <button
            type="button"
            onClick={confirmAllLabels}
            className="pressable inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-bold text-navy"
          >
            <Check className="h-3.5 w-3.5" />
            Confirm all
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-xl bg-surface p-2 shadow-float"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-elevated">
              <Image
                src={displayUrl(item)}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
                unoptimized={displayUrl(item).startsWith("http")}
              />
              {item.is_cover && (
                <span className="absolute bottom-0 left-0 right-0 bg-gold/90 py-0.5 text-center text-[9px] font-bold text-navy">
                  Cover
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <select
                value={item.room_label ?? ""}
                onChange={(e) => updateLabel(item.id, e.target.value)}
                className="w-full rounded-lg border-0 bg-elevated px-2 py-2 text-xs font-semibold text-foreground"
                aria-label={`Label for photo ${index + 1}`}
              >
                <option value="">Choose room…</option>
                {ROOM_LABELS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex shrink-0 flex-col gap-0.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                className="pressable flex h-7 w-7 items-center justify-center rounded-lg bg-elevated text-muted disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => move(index, index + 1)}
                className="pressable flex h-7 w-7 items-center justify-center rounded-lg bg-elevated text-muted disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onChange(setCoverItem(items, item.id))}
              className={cn(
                "pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                item.is_cover ? "bg-gold text-navy" : "bg-elevated text-muted"
              )}
              aria-label="Set as cover photo"
            >
              <Star className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onChange(removeMediaItem(items, item.id))}
              className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated text-danger"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

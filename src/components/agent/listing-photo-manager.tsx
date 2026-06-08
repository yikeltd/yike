"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Star,
  Upload,
  X,
} from "lucide-react";
import { MIN_LISTING_IMAGES } from "@/lib/constants";
import { ROOM_LABELS } from "@/lib/media/labels";
import {
  applyDefaultLabels,
  createMediaItemFromUpload,
  reorderMediaItems,
  removeMediaItem,
  setCoverItem,
  sortMediaItemsForStory,
} from "@/lib/media/items";
import {
  prepareListingUpload,
  revokeListingPreview,
} from "@/lib/media/prepare-listing-upload";
import {
  type ListingPhotoItem,
  isUploadingItem,
  photoThumbSrc,
} from "@/components/agent/listing-photo-types";
import { friendlyStorageError } from "@/lib/media/storage-errors";
import { cn } from "@/lib/utils";

type Props = {
  propertyId?: string;
  items: ListingPhotoItem[];
  onChange: (items: ListingPhotoItem[]) => void;
};

const MAX_CONCURRENT = 2;

export function ListingPhotoManager({
  propertyId = "draft",
  items,
  onChange,
}: Props) {
  const [error, setError] = useState("");
  const [activeUploads, setActiveUploads] = useState(0);
  const queueRef = useRef<{ id: string; index: number }[]>([]);
  const fileMapRef = useRef<Map<string, File>>(new Map());
  const runningRef = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const ready =
    items.filter((i) => i.upload_status !== "uploading" && i.upload_status !== "error")
      .length >= MIN_LISTING_IMAGES;

  const pumpQueue = useCallback(async () => {
    while (
      runningRef.current < MAX_CONCURRENT &&
      queueRef.current.length > 0
    ) {
      const job = queueRef.current.shift();
      if (!job) break;
      runningRef.current += 1;
      setActiveUploads((n) => n + 1);

      try {
        const file = fileMapRef.current.get(job.id);
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        form.append("propertyId", propertyId);
        form.append("index", String(job.index));
        form.append("kind", "image");

        const res = await fetch("/api/media/upload", { method: "POST", body: form });
        const json = await res.json();

        if (!res.ok) {
          onChange(
            itemsRef.current.map((item) =>
              item.id === job.id
                ? {
                    ...item,
                    upload_status: "error" as const,
                    upload_error: friendlyStorageError(
                      json.error ?? "Upload failed"
                    ),
                  }
                : item
            )
          );
        } else {
          const prev = itemsRef.current.find((i) => i.id === job.id);
          if (prev?.local_preview) revokeListingPreview(prev.local_preview);
          fileMapRef.current.delete(job.id);

          onChange(
            itemsRef.current.map((item) =>
              item.id === job.id
                ? {
                    ...createMediaItemFromUpload({
                      url: json.url,
                      medium: json.medium,
                      thumbnail: json.thumbnail,
                      index: item.sort_order ?? 0,
                      width: json.width,
                      height: json.height,
                      blur_data_url: json.blur_data_url,
                    }),
                    id: item.id,
                    room_label: item.room_label,
                    is_cover: item.is_cover,
                    upload_status: "ready" as const,
                    small_warning: json.small_warning || item.small_warning,
                  }
                : item
            )
          );
        }
      } catch {
        onChange(
          itemsRef.current.map((item) =>
            item.id === job.id
              ? {
                  ...item,
                  upload_status: "error" as const,
                  upload_error: "Network error — try again",
                }
              : item
          )
        );
      } finally {
        runningRef.current -= 1;
        setActiveUploads((n) => Math.max(0, n - 1));
        void pumpQueue();
      }
    }
  }, [onChange, propertyId]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");

    const startIndex = itemsRef.current.length;
    const pending: ListingPhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const prepared = await prepareListingUpload(files[i]);
        const id = `pending_${Date.now()}_${i}`;
        pending.push({
          ...createMediaItemFromUpload({
            url: prepared.previewUrl,
            medium: prepared.previewUrl,
            thumbnail: prepared.previewUrl,
            index: startIndex + i,
            width: prepared.width,
            height: prepared.height,
          }),
          id,
          local_preview: prepared.previewUrl,
          upload_status: "uploading",
          small_warning: prepared.smallWarning,
        });
        fileMapRef.current.set(id, prepared.file);
        queueRef.current.push({
          id,
          index: Date.now() + startIndex + i,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add photo");
      }
    }

    if (pending.length > 0) {
      onChange([...itemsRef.current, ...pending]);
      void pumpQueue();
    }
  }

  function updateLabel(id: string, room_label: string) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, room_label } : item))
    );
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    onChange(reorderMediaItems(items, from, to) as ListingPhotoItem[]);
  }

  function remove(id: string) {
    const item = items.find((i) => i.id === id);
    if (item?.local_preview) revokeListingPreview(item.local_preview);
    fileMapRef.current.delete(id);
    onChange(removeMediaItem(items, id) as ListingPhotoItem[]);
  }

  function confirmAllLabels() {
    onChange(sortMediaItemsForStory(applyDefaultLabels(items)) as ListingPhotoItem[]);
  }

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => {
        if (i.local_preview) revokeListingPreview(i.local_preview);
      });
    };
  }, []);

  const uploading = activeUploads > 0;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-xl border border-dashed border-gold/35 bg-gold/5 p-4 transition-all",
          uploading && "ring-2 ring-gold/25"
        )}
      >
        <label className="flex cursor-pointer flex-col items-center gap-1.5 touch-feedback">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            className="sr-only"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          ) : (
            <Upload className="h-8 w-8 text-navy" />
          )}
          <span className="text-sm font-bold text-navy">
            Add clear photos of the property
          </span>
          <span className="text-xs text-muted">Yike will optimize them automatically.</span>
        </label>
        {error ? (
          <p className="mt-2 text-center text-sm font-medium text-danger">{error}</p>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              Drag order with arrows · star sets cover
            </p>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-semibold",
                  ready ? "text-gold-dark" : "text-muted"
                )}
              >
                {items.length} photo{items.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={confirmAllLabels}
                className="pressable inline-flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-bold text-navy"
              >
                <Check className="h-3.5 w-3.5" />
                Sort story
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {items.map((item, index) => {
              const thumb = photoThumbSrc(item);
              const uploadingItem = isUploadingItem(item);
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl bg-surface p-2 shadow-float"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-elevated">
                    {thumb.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                        unoptimized={
                          thumb.startsWith("blob:") || thumb.startsWith("data:")
                        }
                      />
                    )}
                    {uploadingItem ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-navy/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    ) : null}
                    {item.is_cover ? (
                      <span className="absolute bottom-0 left-0 right-0 bg-gold/90 py-0.5 text-center text-[9px] font-bold text-navy">
                        Cover
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <select
                      value={item.room_label ?? ""}
                      onChange={(e) => updateLabel(item.id, e.target.value)}
                      disabled={uploadingItem}
                      className="w-full rounded-lg border-0 bg-elevated px-2 py-2 text-xs font-semibold text-foreground disabled:opacity-60"
                      aria-label={`Label for photo ${index + 1}`}
                    >
                      <option value="">Room label…</option>
                      {ROOM_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {item.small_warning ? (
                      <p className="text-[10px] text-amber-700">
                        May look blurry — a clearer photo performs better.
                      </p>
                    ) : null}
                    {item.upload_status === "error" ? (
                      <p className="text-[10px] text-danger">
                        {item.upload_error ?? "Upload failed"}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0 || uploadingItem}
                      onClick={() => move(index, index - 1)}
                      className="pressable flex h-7 w-7 items-center justify-center rounded-lg bg-elevated text-muted disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1 || uploadingItem}
                      onClick={() => move(index, index + 1)}
                      className="pressable flex h-7 w-7 items-center justify-center rounded-lg bg-elevated text-muted disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={uploadingItem}
                    onClick={() => onChange(setCoverItem(items, item.id) as ListingPhotoItem[])}
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
                    onClick={() => remove(item.id)}
                    className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated text-danger"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

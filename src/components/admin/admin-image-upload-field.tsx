"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { AdminCreativeSpec } from "@/constants/adminCreativeSpecs";
import type { ImagePreset } from "@/lib/media/constants";
import { AdminCreativeSizeCallout } from "@/components/admin/admin-creative-size-callout";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (url: string) => void;
  preset: ImagePreset;
  folder: string;
  label?: string;
  hint?: string;
  sizeSpec?: AdminCreativeSpec;
  disabled?: boolean;
};

/** Staff upload — server always converts to WebP before storage. */
export function AdminImageUploadField({
  value,
  onChange,
  preset,
  folder,
  label = "Image",
  hint,
  sizeSpec,
  disabled,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("preset", preset);
    fd.append("folder", folder);

    const res = await fetch("/api/admin/media/upload-image", {
      method: "POST",
      body: fd,
    });
    const data = (await res.json()) as { imageUrl?: string; error?: string };
    setUploading(false);

    if (!res.ok || !data.imageUrl) {
      setError(data.error ?? "Upload failed");
      return;
    }
    onChange(data.imageUrl);
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted">{label}</p>
      {sizeSpec ? (
        <div className="mb-2">
          <AdminCreativeSizeCallout spec={sizeSpec} />
        </div>
      ) : null}
      {hint ? (
        <p className="mb-2 text-xs text-muted">{hint}</p>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Compressing…" : value ? "Replace image" : "Upload image"}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            className="text-danger"
            disabled={disabled || uploading}
            onClick={() => onChange("")}
          >
            Remove
          </Button>
        ) : null}
      </div>
      {value ? (
        <div className="mt-3 flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
            <Image
              src={value}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="min-w-0 flex-1 truncate pt-1 text-xs text-muted">{value}</p>
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

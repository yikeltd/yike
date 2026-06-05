"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { MEDIA_LIMITS } from "@/lib/media/constants";
import { cn } from "@/lib/utils";

type Props = {
  propertyId?: string;
  onUploaded: (urls: { url: string; medium: string; thumbnail: string }) => void;
};

export function ImageUploader({ propertyId = "draft", onUploaded }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setLoading(true);
    const total = files.length;

    for (let i = 0; i < total; i++) {
      setProgress(`Uploading ${i + 1} of ${total}…`);
      const file = files[i];
      if (file.size > MEDIA_LIMITS.maxUploadBytes) {
        setError("Each image must be under 15MB.");
        setLoading(false);
        setProgress("");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      form.append("propertyId", propertyId);
      form.append("index", String(Date.now() + i));
      form.append("kind", "image");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Upload failed");
        setLoading(false);
        setProgress("");
        return;
      }
      onUploaded({
        url: json.url,
        medium: json.medium,
        thumbnail: json.thumbnail,
      });
    }
    setLoading(false);
    setProgress("");
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-gold/5 p-4 transition-all",
        loading && "ring-2 ring-gold/40"
      )}
    >
      <label className="flex cursor-pointer flex-col items-center gap-2 touch-feedback">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          multiple
          className="sr-only"
          disabled={loading}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        ) : (
          <Upload className="h-8 w-8 text-navy" />
        )}
        <span className="text-sm font-bold text-navy">
          {loading ? progress || "Processing…" : "Add photos"}
        </span>
        <span className="text-xs text-muted">
          Tap to upload · WebP optimized · max 15MB
        </span>
      </label>
      {error && (
        <p className="mt-2 text-center text-sm font-medium text-danger">{error}</p>
      )}
    </div>
  );
}

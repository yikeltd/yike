"use client";

import { useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { MEDIA_LIMITS } from "@/lib/media/constants";
import { cn } from "@/lib/utils";

type Props = {
  propertyId?: string;
  onUploaded: (urls: { url: string; medium: string; thumbnail: string }) => void;
  uploadedCount?: number;
};

export function ImageUploader({
  propertyId = "draft",
  onUploaded,
  uploadedCount = 0,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setLoading(true);
    const total = files.length;
    let uploaded = 0;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      if (file.size > MEDIA_LIMITS.maxUploadBytes) {
        setError("One photo was too large. Try a smaller image.");
        setLoading(false);
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
        setError(json.error ?? "Upload failed — try again");
        setLoading(false);
        return;
      }
      uploaded += 1;
      setDone(uploaded);
      onUploaded({
        url: json.url,
        medium: json.medium,
        thumbnail: json.thumbnail,
      });
    }
    setLoading(false);
    setTimeout(() => setDone(0), 1500);
  }

  const totalShown = uploadedCount + (loading ? done : 0);

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-gold/35 bg-gold/5 p-4 transition-all",
        loading && "ring-2 ring-gold/30"
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
          {loading ? `Adding photos…` : "Add clear photos of the property"}
        </span>
        {totalShown > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-gold-dark">
            <Check className="h-3.5 w-3.5" />
            {uploadedCount} photo{uploadedCount === 1 ? "" : "s"} added
          </span>
        )}
      </label>
      {error && (
        <p className="mt-2 text-center text-sm font-medium text-danger">{error}</p>
      )}
    </div>
  );
}

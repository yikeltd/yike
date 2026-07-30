"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
};

export function MediaEngine({ photos, onPhotosChange }: Props) {
  const [dragOver, setDragOver] = useState(false);

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.type.startsWith("image/")) {
        newUrls.push(URL.createObjectURL(file));
      }
    }

    if (newUrls.length > 0) {
      onPhotosChange([...photos, ...newUrls]);
    }
  }

  function removePhoto(idx: number) {
    onPhotosChange(photos.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {/* DRAG AND DROP / MOBILE PICKER ZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            const newUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              if (file && file.type.startsWith("image/")) {
                newUrls.push(URL.createObjectURL(file));
              }
            }
            if (newUrls.length > 0) {
              onPhotosChange([...photos, ...newUrls]);
            }
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition-all cursor-pointer bg-slate-50/50 hover:bg-slate-100/50 min-h-[140px]",
          dragOver ? "border-[#E4B547] bg-[#E4B547]/10" : "border-slate-300"
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileAdd}
          className="absolute inset-0 z-10 opacity-0 cursor-pointer w-full h-full"
        />

        <div className="flex items-center justify-center gap-3 text-[#031B4E] mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4B547]/20 text-[#031B4E]">
            <Upload className="h-5 w-5" />
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 sm:hidden">
            <Camera className="h-5 w-5" />
          </div>
        </div>

        <p className="text-xs md:text-sm font-extrabold text-[#031B4E]">
          Tap to upload or drag photos here
        </p>
        <p className="text-[11px] font-medium text-slate-400">
          Supports PNG, JPG, WebP. High resolution recommended.
        </p>
      </div>

      {/* PHOTO PREVIEWS GRID */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {photos.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Upload preview ${idx + 1}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-xs shadow-md hover:bg-rose-700 transition-colors"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#031B4E]/80 px-2 py-0.5 text-[9px] font-extrabold text-[#E4B547] backdrop-blur-xs">
                  Cover Photo
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

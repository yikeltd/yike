/**
 * Central image compression entry — all uploads should route through here.
 * Server-side only (sharp).
 */
import {
  optimizeCoverImage,
  optimizeImagePreset,
  optimizeProfileAvatarImage,
  optimizeUploadedImage,
  readImageUploadBuffer,
  type OptimizedCoverSet,
  type OptimizedImageSet,
  type ProcessedWebpImage,
} from "@/lib/media/image";
import type { ImagePreset } from "@/lib/media/constants";

export type CompressImageContext =
  | "property_photo"
  | "profile_avatar"
  | "profile_cover"
  | "ad_creative"
  | "email_sponsor"
  | "banner"
  | "document_preview";

const PRESET_BY_CONTEXT: Partial<Record<CompressImageContext, ImagePreset>> = {
  email_sponsor: "square",
  ad_creative: "card",
  banner: "banner",
};

export type CompressImageResult =
  | OptimizedImageSet
  | OptimizedCoverSet
  | ProcessedWebpImage;

/** Compress an in-memory image buffer for the given upload context. */
export async function compressImageBuffer(
  buffer: Buffer,
  context: CompressImageContext,
  options?: { focalY?: number }
): Promise<CompressImageResult> {
  switch (context) {
    case "property_photo":
      return optimizeUploadedImage(buffer);
    case "profile_avatar":
      return optimizeProfileAvatarImage(buffer);
    case "profile_cover":
      return optimizeCoverImage(buffer, options?.focalY);
    case "document_preview":
      throw new Error("Documents are uploaded without image compression.");
    default: {
      const preset = PRESET_BY_CONTEXT[context] ?? "card";
      return optimizeImagePreset(buffer, preset);
    }
  }
}

/** Read a browser File and compress for the given context. */
export async function compressImage(
  file: File,
  context: CompressImageContext,
  options?: { focalY?: number }
): Promise<CompressImageResult> {
  const buffer = await readImageUploadBuffer(file);
  return compressImageBuffer(buffer, context, options);
}

/** Map admin upload preset to compression context. */
export function compressContextFromPreset(
  preset: ImagePreset
): "email_sponsor" | "banner" | "ad_creative" {
  if (preset === "square") return "email_sponsor";
  if (preset === "banner" || preset === "strip") return "banner";
  return "ad_creative";
}

/** Admin single-size WebP output (ads, banners, email chips). */
export async function compressAdminPresetImage(
  buffer: Buffer,
  preset: ImagePreset
): Promise<ProcessedWebpImage> {
  const result = await compressImageBuffer(buffer, compressContextFromPreset(preset));
  return result as ProcessedWebpImage;
}

/** Property listing photos — thumb, medium, and large WebP variants. */
export async function compressPropertyPhoto(buffer: Buffer): Promise<OptimizedImageSet> {
  return compressImageBuffer(buffer, "property_photo") as Promise<OptimizedImageSet>;
}

/** Profile avatar — square thumb, medium, and large variants. */
export async function compressProfileAvatar(buffer: Buffer): Promise<OptimizedImageSet> {
  return compressImageBuffer(buffer, "profile_avatar") as Promise<OptimizedImageSet>;
}

/** Profile cover banner — responsive variants with optional focal point. */
export async function compressProfileCover(
  buffer: Buffer,
  focalY?: number
): Promise<OptimizedCoverSet> {
  return compressImageBuffer(buffer, "profile_cover", { focalY }) as Promise<OptimizedCoverSet>;
}

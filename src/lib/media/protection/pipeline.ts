/**
 * Enterprise media protection pipeline — listing photos.
 * Server-side only. Does not change the public upload API contract.
 */
import sharp from "sharp";
import { randomUUID } from "crypto";
import { IMAGE_SIZES, MEDIA_LIMITS } from "@/lib/media/constants";
import { resolveWatermarkAttribution, type AttributionProfile } from "./attribution";
import { computeImageFingerprints, type ImageFingerprints } from "./fingerprint";
import {
  getMediaProtectionConfig,
  MEDIA_PROTECTION_ARCHIVE_BUCKET,
  MEDIA_PROTECTION_PUBLIC_BUCKET,
  type MediaProtectionConfig,
} from "./config";
import { applyProtectionWatermarks } from "./watermark";

export type ProtectListingImageInput = {
  buffer: Buffer;
  profile: AttributionProfile;
  ownerId: string;
  listingRef: string;
  listingId: string | null;
  index: number;
  mimeSource: string | null;
  assetType?: "property" | "vehicle" | "other";
  imageUuid?: string;
};

export type ProtectListingImageResult = {
  imageUuid: string;
  thumbnail: Buffer;
  medium: Buffer;
  large: Buffer;
  blurDataUrl: string;
  widths: { thumbnail: number; medium: number; large: number };
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
  smallSource: boolean;
  fingerprints: ImageFingerprints;
  watermarkLabel: string;
  sellerName: string | null;
  companyName: string | null;
  watermarkVersion: string;
  pipelineVersion: string;
  mediaVersion: string;
  watermarkColor: "white" | "gold";
  archiveBuffer: Buffer;
  paths: {
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  };
  buckets: {
    public: string;
    archive: string;
  };
  protectionEnabled: true;
  adaptive: {
    padX: number;
    padY: number;
    cornerOpacity: number;
    patternOpacity: number;
    fontSize: number;
  };
};

function isTinySource(width: number, height: number): boolean {
  return (
    width > 0 &&
    height > 0 &&
    width < MEDIA_LIMITS.minSharpWidth &&
    height < MEDIA_LIMITS.minSharpHeight
  );
}

async function resizeToWebp(
  pipeline: sharp.Sharp,
  width: number,
  quality: number
): Promise<Buffer> {
  return pipeline
    .clone()
    .resize(width, null, {
      withoutEnlargement: true,
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality, effort: 5, smartSubsample: true })
    .toBuffer();
}

async function toBlurPlaceholder(pipeline: sharp.Sharp): Promise<string> {
  const buf = await pipeline
    .clone()
    .resize(IMAGE_SIZES.blur.width, null, {
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: IMAGE_SIZES.blur.quality })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

export function buildProtectedStoragePaths(
  listingRef: string,
  index: number,
  ownerId: string,
  imageUuid: string
): ProtectListingImageResult["paths"] {
  const base = `properties/${listingRef}/${index}`;
  return {
    thumbnail: `${base}-thumb.webp`,
    medium: `${base}-md.webp`,
    large: `${base}-lg.webp`,
    original: `originals/${ownerId}/${imageUuid}.bin`,
  };
}

/**
 * Full protect path: fingerprint → resize → watermark → private archive paths.
 */
export async function protectListingImage(
  input: ProtectListingImageInput,
  config: MediaProtectionConfig = getMediaProtectionConfig()
): Promise<ProtectListingImageResult> {
  if (input.buffer.length > MEDIA_LIMITS.maxUploadBytes) {
    throw new Error("Image is too large. Try a smaller photo.");
  }

  const imageUuid = input.imageUuid || randomUUID();
  const attribution = resolveWatermarkAttribution(input.profile);

  const fingerprints = await computeImageFingerprints(input.buffer);

  const base = sharp(input.buffer, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const originalWidth = meta.width ?? 0;
  const originalHeight = meta.height ?? 0;
  const smallSource = isTinySource(originalWidth, originalHeight);

  // Strip unsafe EXIF before public variants; keep archive as original bytes.
  const stripped = base.withMetadata({ exif: undefined, icc: undefined });

  const [rawThumb, rawMedium, rawLarge, blurDataUrl] = await Promise.all([
    resizeToWebp(stripped, IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.quality),
    resizeToWebp(stripped, IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.quality),
    resizeToWebp(stripped, IMAGE_SIZES.large.width, IMAGE_SIZES.large.quality),
    toBlurPlaceholder(stripped),
  ]);

  const [thumbWm, mediumWm, largeWm] = await Promise.all([
    applyProtectionWatermarks(rawThumb, attribution.watermarkLabel, `${imageUuid}:t`, config),
    applyProtectionWatermarks(rawMedium, attribution.watermarkLabel, `${imageUuid}:m`, config),
    applyProtectionWatermarks(rawLarge, attribution.watermarkLabel, `${imageUuid}:l`, config),
  ]);

  const paths = buildProtectedStoragePaths(
    input.listingRef,
    input.index,
    input.ownerId,
    imageUuid
  );

  return {
    imageUuid,
    thumbnail: thumbWm.buffer,
    medium: mediumWm.buffer,
    large: largeWm.buffer,
    blurDataUrl,
    widths: {
      thumbnail: IMAGE_SIZES.thumbnail.width,
      medium: IMAGE_SIZES.medium.width,
      large: IMAGE_SIZES.large.width,
    },
    originalWidth,
    originalHeight,
    processedWidth: largeWm.width,
    processedHeight: largeWm.height,
    smallSource,
    fingerprints,
    watermarkLabel: attribution.watermarkLabel,
    sellerName: attribution.sellerName,
    companyName: attribution.companyName,
    watermarkVersion: config.watermarkVersion,
    pipelineVersion: config.pipelineVersion,
    mediaVersion: config.mediaVersion,
    watermarkColor: largeWm.color,
    archiveBuffer: input.buffer,
    paths,
    buckets: {
      public: MEDIA_PROTECTION_PUBLIC_BUCKET,
      archive: MEDIA_PROTECTION_ARCHIVE_BUCKET,
    },
    protectionEnabled: true,
    adaptive: largeWm.params,
  };
}

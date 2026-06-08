import sharp from "sharp";
import { IMAGE_SIZES, MEDIA_LIMITS } from "./constants";

export type OptimizedImageSet = {
  thumbnail: Buffer;
  medium: Buffer;
  large: Buffer;
  blurDataUrl: string;
  widths: { thumbnail: number; medium: number; large: number };
  originalWidth: number;
  originalHeight: number;
  smallSource: boolean;
};

export async function optimizeUploadedImage(
  input: Buffer
): Promise<OptimizedImageSet> {
  if (input.length > MEDIA_LIMITS.maxUploadBytes) {
    throw new Error("Image is too large. Try a smaller photo.");
  }

  const base = sharp(input, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const originalWidth = meta.width ?? 0;
  const originalHeight = meta.height ?? 0;
  const longEdge = Math.max(originalWidth, originalHeight);
  const smallSource = longEdge > 0 && longEdge < MEDIA_LIMITS.minSharpLongEdge;

  const stripped = base.withMetadata({ exif: undefined, icc: undefined });

  const [thumbnail, medium, large, blur] = await Promise.all([
    toWebp(stripped, IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.quality),
    toWebp(stripped, IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.quality),
    toWebp(stripped, IMAGE_SIZES.large.width, IMAGE_SIZES.large.quality),
    toBlurPlaceholder(stripped),
  ]);

  return {
    thumbnail,
    medium,
    large,
    blurDataUrl: blur,
    widths: {
      thumbnail: IMAGE_SIZES.thumbnail.width,
      medium: IMAGE_SIZES.medium.width,
      large: IMAGE_SIZES.large.width,
    },
    originalWidth,
    originalHeight,
    smallSource,
  };
}

async function toWebp(
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
    .webp({
      quality,
      effort: 6,
      smartSubsample: true,
      nearLossless: false,
    })
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

export function buildStoragePaths(
  propertyId: string,
  index: number
): { thumbnail: string; medium: string; large: string } {
  const base = `properties/${propertyId}/${index}`;
  return {
    thumbnail: `${base}-thumb.webp`,
    medium: `${base}-md.webp`,
    large: `${base}-lg.webp`,
  };
}

export function buildAvatarStoragePaths(userId: string): {
  thumbnail: string;
  medium: string;
  large: string;
} {
  const base = `avatars/${userId}`;
  return {
    thumbnail: `${base}/thumb.webp`,
    medium: `${base}/md.webp`,
    large: `${base}/lg.webp`,
  };
}

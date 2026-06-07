import sharp from "sharp";
import { IMAGE_SIZES, MEDIA_LIMITS } from "./constants";

export type OptimizedImageSet = {
  thumbnail: Buffer;
  medium: Buffer;
  large: Buffer;
  widths: { thumbnail: number; medium: number; large: number };
};

export async function optimizeUploadedImage(
  input: Buffer
): Promise<OptimizedImageSet> {
  if (input.length > MEDIA_LIMITS.maxUploadBytes) {
    throw new Error(
      `Image exceeds ${MEDIA_LIMITS.maxUploadBytes / 1024 / 1024}MB limit`
    );
  }

  const base = sharp(input, { failOn: "none" })
    .rotate()
    .withMetadata({ exif: undefined, icc: undefined });

  const [thumbnail, medium, large] = await Promise.all([
    toWebp(base, IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.quality),
    toWebp(base, IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.quality),
    toWebp(base, IMAGE_SIZES.large.width, IMAGE_SIZES.large.quality),
  ]);

  return {
    thumbnail,
    medium,
    large,
    widths: {
      thumbnail: IMAGE_SIZES.thumbnail.width,
      medium: IMAGE_SIZES.medium.width,
      large: IMAGE_SIZES.large.width,
    },
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
    })
    .webp({
      quality,
      effort: 6,
      smartSubsample: true,
      nearLossless: false,
    })
    .toBuffer();
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

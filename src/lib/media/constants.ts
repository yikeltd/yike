/** Media optimization limits — Yike.ng */
export const MEDIA_LIMITS = {
  maxUploadBytes: 15 * 1024 * 1024, // 15MB before compression
  maxVideoUploadBytes: 15 * 1024 * 1024,
  maxVideoDurationSec: 30,
  maxVideoOptimizedBytes: 8 * 1024 * 1024,
  targets: {
    thumbnailKb: 80,
    listingKb: 200,
    heroKb: 300,
  },
} as const;

export const IMAGE_SIZES = {
  thumbnail: { width: 320, quality: 72 },
  medium: { width: 720, quality: 78 },
  large: { width: 1200, quality: 82 },
} as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;

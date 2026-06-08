/** Media optimization limits — Yike.ng */
export const MEDIA_LIMITS = {
  maxUploadBytes: 15 * 1024 * 1024, // 15MB before compression
  maxVideoUploadBytes: 15 * 1024 * 1024,
  maxVideoDurationSec: 30,
  maxVideoOptimizedBytes: 8 * 1024 * 1024,
  /** Warn agents when source long edge is below this — still allow upload. */
  minSharpLongEdge: 480,
  /** Client pre-upload resize cap — server also caps at gallery_large. */
  clientMaxLongEdge: 2000,
  targets: {
    thumbnailKb: 80,
    listingKb: 200,
    heroKb: 300,
  },
} as const;

/** Quality-preserving WebP variants — do not go below quality 75. */
export const IMAGE_SIZES = {
  thumbnail: { width: 320, quality: 82 },
  medium: { width: 768, quality: 84 },
  large: { width: 1600, quality: 86 },
  blur: { width: 24, quality: 40 },
} as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;

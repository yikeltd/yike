/** Media optimization limits — Yike.ng */
/** Post-compression caps for profile media outputs. */
export const PROFILE_MEDIA_LIMITS = {
  avatarMaxOutputBytes: 2 * 1024 * 1024,
  coverMaxOutputBytes: 5 * 1024 * 1024,
  coverAspectRatio: 3, // width : height (LinkedIn/Facebook-style banner)
  coverFocalDefault: 50,
} as const;

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

/** Cover banner variants — 3:1 crop, centre-safe with focal Y. */
export const COVER_SIZES = {
  thumbnail: { width: 640, quality: 82 },
  medium: { width: 1024, quality: 84 },
  large: { width: 1600, quality: 86 },
  blur: { width: 32, quality: 40 },
} as const;

/** Single-size presets — all uploads must pass through one of these or IMAGE_SIZES responsive set. */
export const IMAGE_PRESET_SIZES = {
  square: { width: 80, height: 80, fit: "cover" as const, quality: 82 },
  card: { width: 768, fit: "inside" as const, quality: 84 },
  banner: { width: 1200, fit: "inside" as const, quality: 84 },
  strip: { width: 1600, fit: "inside" as const, quality: 82 },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESET_SIZES;

export const WEBP_CONTENT_TYPE = "image/webp" as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;

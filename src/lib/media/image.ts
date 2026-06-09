import sharp from "sharp";
import {
  ALLOWED_IMAGE_TYPES,
  COVER_SIZES,
  IMAGE_PRESET_SIZES,
  IMAGE_SIZES,
  MEDIA_LIMITS,
  PROFILE_MEDIA_LIMITS,
  WEBP_CONTENT_TYPE,
  type ImagePreset,
} from "./constants";

export type { ImagePreset };
export { WEBP_CONTENT_TYPE };

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

/** Sniff image format from magic bytes — Android gallery often sends empty MIME. */
export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e) return "image/png";
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45
  ) {
    return "image/webp";
  }
  return null;
}

/** Resolve MIME from File.type, extension, or buffer sniff. */
export function resolveImageMime(file: File, buffer?: Buffer): string | null {
  const type = file.type?.trim();
  if (type && type !== "application/octet-stream" && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) {
    return type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  const fromExt = ext ? EXT_MIME[ext] ?? null : null;
  if (fromExt) return fromExt;
  if (buffer) return sniffImageMime(buffer);
  return type?.startsWith("image/") ? type : null;
}

export async function readImageUploadBuffer(file: File): Promise<Buffer> {
  const mime = resolveImageMime(file);
  if (!mime) {
    throw new Error("Upload a JPG, PNG, WebP, or HEIC image.");
  }
  if (file.size > MEDIA_LIMITS.maxUploadBytes) {
    throw new Error("Image is too large. Try a smaller photo.");
  }
  return Buffer.from(await file.arrayBuffer());
}

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

export type ProcessedWebpImage = {
  buffer: Buffer;
  width: number;
  height: number;
  format: "webp";
  contentType: typeof WEBP_CONTENT_TYPE;
};

function stripMetadata(pipeline: sharp.Sharp): sharp.Sharp {
  return pipeline.withMetadata({ exif: undefined, icc: undefined });
}

function webpOptions(quality: number): sharp.WebpOptions {
  return {
    quality,
    effort: 6,
    smartSubsample: true,
    nearLossless: false,
  };
}

/** Single WebP output for ads, banners, chips — always strips EXIF and compresses. */
export async function optimizeImagePreset(
  input: Buffer,
  preset: ImagePreset
): Promise<ProcessedWebpImage> {
  if (input.length > MEDIA_LIMITS.maxUploadBytes) {
    throw new Error("Image is too large. Try a smaller photo.");
  }

  const cfg = IMAGE_PRESET_SIZES[preset];
  let pipeline = stripMetadata(sharp(input, { failOn: "none" }).rotate());

  if ("height" in cfg && cfg.fit === "cover") {
    pipeline = pipeline.resize(cfg.width, cfg.height, {
      fit: "cover",
      position: "centre",
    });
  } else {
    pipeline = pipeline.resize(cfg.width, null, {
      withoutEnlargement: true,
      fit: cfg.fit,
      kernel: sharp.kernel.lanczos3,
    });
  }

  const buffer = await pipeline.webp(webpOptions(cfg.quality)).toBuffer();
  const meta = await sharp(buffer).metadata();

  return {
    buffer,
    width: meta.width ?? cfg.width,
    height: meta.height ?? ("height" in cfg ? cfg.height : 0),
    format: "webp",
    contentType: WEBP_CONTENT_TYPE,
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
    .webp(webpOptions(quality))
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
  const base = `${userId}`;
  return {
    thumbnail: `${base}/avatar-thumb.webp`,
    medium: `${base}/avatar.webp`,
    large: `${base}/avatar-lg.webp`,
  };
}

export function buildCoverStoragePaths(userId: string): {
  thumbnail: string;
  medium: string;
  large: string;
} {
  const base = `${userId}`;
  return {
    thumbnail: `${base}/cover-thumb.webp`,
    medium: `${base}/cover.webp`,
    large: `${base}/cover-lg.webp`,
  };
}

export type OptimizedCoverSet = OptimizedImageSet;

function clampFocalY(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeCoverExtract(
  width: number,
  height: number,
  aspect: number,
  focalY: number
): { left: number; top: number; width: number; height: number } {
  let cropW: number;
  let cropH: number;
  const sourceAspect = width / height;
  if (sourceAspect > aspect) {
    cropH = height;
    cropW = Math.round(height * aspect);
  } else {
    cropW = width;
    cropH = Math.round(width / aspect);
  }
  const left = Math.round((width - cropW) / 2);
  const focalPx = (clampFocalY(focalY) / 100) * height;
  let top = Math.round(focalPx - cropH / 2);
  top = Math.max(0, Math.min(height - cropH, top));
  return { left, top, width: cropW, height: cropH };
}

async function toCoverWebp(
  pipeline: sharp.Sharp,
  width: number,
  quality: number
): Promise<Buffer> {
  const height = Math.round(width / PROFILE_MEDIA_LIMITS.coverAspectRatio);
  return pipeline
    .clone()
    .resize(width, height, {
      fit: "cover",
      position: "centre",
      kernel: sharp.kernel.lanczos3,
    })
    .webp(webpOptions(quality))
    .toBuffer();
}

/** Banner cover — 3:1 crop with vertical focal point, three WebP sizes. */
export async function optimizeCoverImage(
  input: Buffer,
  focalY: number = PROFILE_MEDIA_LIMITS.coverFocalDefault
): Promise<OptimizedCoverSet> {
  if (input.length > MEDIA_LIMITS.maxUploadBytes) {
    throw new Error("Image is too large. Try a smaller photo.");
  }

  const base = sharp(input, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const originalWidth = meta.width ?? 0;
  const originalHeight = meta.height ?? 0;
  const longEdge = Math.max(originalWidth, originalHeight);
  const smallSource = longEdge > 0 && longEdge < MEDIA_LIMITS.minSharpLongEdge;

  const extract = computeCoverExtract(
    originalWidth,
    originalHeight,
    PROFILE_MEDIA_LIMITS.coverAspectRatio,
    focalY
  );

  const cropped = stripMetadata(
    base.extract({
      left: extract.left,
      top: extract.top,
      width: extract.width,
      height: extract.height,
    })
  );

  const [thumbnail, medium, large, blur] = await Promise.all([
    toCoverWebp(cropped, COVER_SIZES.thumbnail.width, COVER_SIZES.thumbnail.quality),
    toCoverWebp(cropped, COVER_SIZES.medium.width, COVER_SIZES.medium.quality),
    toCoverWebp(cropped, COVER_SIZES.large.width, COVER_SIZES.large.quality),
    toBlurPlaceholder(cropped),
  ]);

  const totalBytes = thumbnail.length + medium.length + large.length;
  if (totalBytes > PROFILE_MEDIA_LIMITS.coverMaxOutputBytes) {
    throw new Error("Cover is too large after compression. Try a simpler image.");
  }

  return {
    thumbnail,
    medium,
    large,
    blurDataUrl: blur,
    widths: {
      thumbnail: COVER_SIZES.thumbnail.width,
      medium: COVER_SIZES.medium.width,
      large: COVER_SIZES.large.width,
    },
    originalWidth,
    originalHeight,
    smallSource,
  };
}

export function assertAvatarOutputSize(optimized: OptimizedImageSet): void {
  const total =
    optimized.thumbnail.length + optimized.medium.length + optimized.large.length;
  if (total > PROFILE_MEDIA_LIMITS.avatarMaxOutputBytes) {
    throw new Error("Photo is too large after compression. Try a simpler image.");
  }
}

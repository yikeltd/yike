import { ALLOWED_VIDEO_TYPES, MEDIA_LIMITS } from "./constants";

export function validateVideoUpload(
  buffer: Buffer,
  mimeType: string,
  durationSec?: number
): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_VIDEO_TYPES.includes(mimeType as (typeof ALLOWED_VIDEO_TYPES)[number])) {
    return { ok: false, error: "Unsupported video format. Use MP4 or WebM." };
  }
  if (buffer.length > MEDIA_LIMITS.maxVideoUploadBytes) {
    return {
      ok: false,
      error: `Video must be under ${MEDIA_LIMITS.maxVideoUploadBytes / 1024 / 1024}MB before processing.`,
    };
  }
  if (
    durationSec !== undefined &&
    durationSec > MEDIA_LIMITS.maxVideoDurationSec
  ) {
    return {
      ok: false,
      error: `Video must be ${MEDIA_LIMITS.maxVideoDurationSec} seconds or less.`,
    };
  }
  return { ok: true };
}

/**
 * Video transcoding to H.264 ≤8MB requires FFmpeg (worker/CI).
 * MVP: store validated upload; set `video_optimized: false` until worker runs.
 */
export const VIDEO_PROCESSING_NOTE =
  "Upload accepted. Server-side H.264 compression runs via media worker.";

/**
 * Premium adaptive watermark overlays (corner attribution + micro YIKE pattern).
 */
import sharp from "sharp";
import { getMediaProtectionConfig, type MediaProtectionConfig } from "./config";

export type AdaptiveWatermarkParams = {
  padX: number;
  padY: number;
  cornerOpacity: number;
  patternOpacity: number;
  fontSize: number;
};

/** Deterministic jitter from image UUID — varies per asset, stable on reprocess. */
export function adaptiveParamsFromSeed(
  seed: string,
  imageWidth: number,
  config: MediaProtectionConfig = getMediaProtectionConfig()
): AdaptiveWatermarkParams {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };

  const cornerSpan = config.cornerOpacityMax - config.cornerOpacityMin;
  const patternSpan = config.patternOpacityMax - config.patternOpacityMin;
  const baseFont = Math.max(11, Math.min(22, Math.round(imageWidth * 0.018)));

  return {
    padX: 10 + Math.floor(u() * 18),
    padY: 8 + Math.floor(u() * 16),
    cornerOpacity: config.cornerOpacityMin + u() * cornerSpan,
    patternOpacity: config.patternOpacityMin + u() * patternSpan,
    fontSize: baseFont + Math.floor(u() * 4) - 1,
  };
}

async function sampleCornerLuminance(
  input: Buffer,
  width: number,
  height: number,
  padX: number,
  padY: number,
  regionW: number,
  regionH: number
): Promise<number> {
  const left = Math.max(0, width - padX - regionW);
  const top = Math.max(0, height - padY - regionH);
  const extractW = Math.min(regionW, width - left);
  const extractH = Math.min(regionH, height - top);
  if (extractW < 4 || extractH < 4) return 128;

  const { data } = await sharp(input, { failOn: "none" })
    .extract({ left, top, width: extractW, height: extractH })
    .resize(16, 16, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i]!;
  return sum / data.length;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPatternSvg(
  width: number,
  height: number,
  opacity: number,
  gap: number,
  color: string
): Buffer {
  const tiles: string[] = [];
  const step = Math.max(80, gap);
  for (let y = -step; y < height + step; y += step) {
    for (let x = -step; x < width + step; x += step) {
      tiles.push(
        `<text x="${x}" y="${y}" fill="${color}" fill-opacity="${opacity.toFixed(3)}" ` +
          `font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="600" ` +
          `transform="rotate(-28 ${x} ${y})">YIKE</text>`
      );
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${tiles.join("")}</svg>`;
  return Buffer.from(svg);
}

function buildCornerSvg(params: {
  width: number;
  height: number;
  label: string;
  color: string;
  opacity: number;
  padX: number;
  padY: number;
  fontSize: number;
}): Buffer {
  const label = escapeXml(params.label);
  const x = params.width - params.padX;
  const y = params.height - params.padY;
  // Soft shadow via duplicate darker text slightly offset — luxury real-estate style
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${params.width}" height="${params.height}">` +
    `<text x="${x}" y="${y}" text-anchor="end" ` +
    `font-family="Helvetica Neue, Helvetica, Arial, sans-serif" ` +
    `font-size="${params.fontSize}" font-weight="500" ` +
    `fill="#000000" fill-opacity="${(params.opacity * 0.35).toFixed(3)}">${label}</text>` +
    `<text x="${x}" y="${y - 1}" text-anchor="end" ` +
    `font-family="Helvetica Neue, Helvetica, Arial, sans-serif" ` +
    `font-size="${params.fontSize}" font-weight="500" ` +
    `letter-spacing="0.04em" ` +
    `fill="${params.color}" fill-opacity="${params.opacity.toFixed(3)}">${label}</text>` +
    `</svg>`;
  return Buffer.from(svg);
}

export type WatermarkApplyResult = {
  buffer: Buffer;
  width: number;
  height: number;
  color: "white" | "gold";
  params: AdaptiveWatermarkParams;
};

/**
 * Apply micro pattern + corner attribution to an already-resized WebP/JPEG buffer.
 */
export async function applyProtectionWatermarks(
  input: Buffer,
  watermarkLabel: string,
  seed: string,
  config: MediaProtectionConfig = getMediaProtectionConfig()
): Promise<WatermarkApplyResult> {
  const meta = await sharp(input, { failOn: "none" }).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < 32 || height < 32) {
    return {
      buffer: input,
      width,
      height,
      color: "white",
      params: adaptiveParamsFromSeed(seed, Math.max(width, 400), config),
    };
  }

  const params = adaptiveParamsFromSeed(seed, width, config);
  const approxLabelW = Math.min(width * 0.55, watermarkLabel.length * params.fontSize * 0.55);
  const approxLabelH = params.fontSize + 8;
  const luminance = await sampleCornerLuminance(
    input,
    width,
    height,
    params.padX,
    params.padY,
    Math.ceil(approxLabelW),
    Math.ceil(approxLabelH)
  );

  const color: "white" | "gold" = luminance < 140 ? "white" : "gold";
  const fill = color === "gold" ? config.brandGold : config.brandWhite;
  // Micro pattern uses near-neutral ink so 2–4% stays barely visible on photos.
  const patternColor = luminance < 128 ? "#FFFFFF" : "#0A0A0A";

  const pattern = buildPatternSvg(
    width,
    height,
    params.patternOpacity,
    Math.round(config.patternGap * (width / 1800)),
    patternColor
  );
  const corner = buildCornerSvg({
    width,
    height,
    label: watermarkLabel,
    color: fill,
    opacity: params.cornerOpacity,
    padX: params.padX,
    padY: params.padY,
    fontSize: params.fontSize,
  });

  let buffer: Buffer;
  try {
    buffer = await sharp(input, { failOn: "none" })
      .composite([
        { input: pattern, top: 0, left: 0 },
        { input: corner, top: 0, left: 0 },
      ])
      .webp({
        quality: 88,
        effort: 5,
        smartSubsample: true,
      })
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: "Yike.ng",
            ImageDescription: `Yike Marketplace · ${watermarkLabel}`,
            Software: `Yike Media Protection ${config.pipelineVersion}`,
          },
        },
      })
      .toBuffer();
  } catch {
    // WebP EXIF support varies — never fail protection for metadata alone.
    buffer = await sharp(input, { failOn: "none" })
      .composite([
        { input: pattern, top: 0, left: 0 },
        { input: corner, top: 0, left: 0 },
      ])
      .webp({
        quality: 88,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer();
  }

  return { buffer, width, height, color, params };
}

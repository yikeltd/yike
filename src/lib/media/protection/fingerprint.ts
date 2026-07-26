/**
 * Cryptographic + perceptual fingerprints for duplicate / fraud foundations.
 * Hashes are computed on the clean (pre-watermark) raster where applicable.
 */
import { createHash } from "crypto";
import sharp from "sharp";

export type ImageFingerprints = {
  sha256: string;
  ahash: string;
  dhash: string;
  phash: string;
};

function bitsToHex(bits: number[]): string {
  const out: string[] = [];
  for (let i = 0; i < bits.length; i += 4) {
    const nibble =
      ((bits[i] ?? 0) << 3) |
      ((bits[i + 1] ?? 0) << 2) |
      ((bits[i + 2] ?? 0) << 1) |
      (bits[i + 3] ?? 0);
    out.push(nibble.toString(16));
  }
  return out.join("");
}

async function grayscalePixels(
  input: Buffer,
  width: number,
  height: number
): Promise<Uint8Array> {
  const { data } = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(width, height, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

/** Average hash — 8×8. */
export async function computeAHash(input: Buffer): Promise<string> {
  const pixels = await grayscalePixels(input, 8, 8);
  let sum = 0;
  for (let i = 0; i < pixels.length; i++) sum += pixels[i]!;
  const avg = sum / pixels.length;
  const bits: number[] = [];
  for (let i = 0; i < pixels.length; i++) bits.push(pixels[i]! >= avg ? 1 : 0);
  return bitsToHex(bits);
}

/** Difference hash — 9×8 horizontal gradients. */
export async function computeDHash(input: Buffer): Promise<string> {
  const pixels = await grayscalePixels(input, 9, 8);
  const bits: number[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = pixels[y * 9 + x]!;
      const right = pixels[y * 9 + x + 1]!;
      bits.push(left < right ? 1 : 0);
    }
  }
  return bitsToHex(bits);
}

/**
 * Perceptual hash (fast foundation) — 32×32 low-pass via 4×4 block averages → 8×8
 * median threshold. Good near-duplicate signal without O(n⁴) DCT cost on upload.
 * Future: swap for full DCT pHash behind the same column without schema change.
 */
export async function computePHash(input: Buffer): Promise<string> {
  const size = 32;
  const pixels = await grayscalePixels(input, size, size);
  const coeffs: number[] = [];
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      let sum = 0;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          sum += pixels[(by * 4 + y) * size + (bx * 4 + x)]!;
        }
      }
      coeffs.push(sum / 16);
    }
  }
  const sorted = [...coeffs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const bits = coeffs.map((c) => (c >= median ? 1 : 0));
  return bitsToHex(bits);
}

export function computeSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function computeImageFingerprints(input: Buffer): Promise<ImageFingerprints> {
  const sha256 = computeSha256(input);
  const [ahash, dhash, phash] = await Promise.all([
    computeAHash(input),
    computeDHash(input),
    computePHash(input),
  ]);
  return { sha256, ahash, dhash, phash };
}

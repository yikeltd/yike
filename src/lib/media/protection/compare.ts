/**
 * Hamming-distance utilities for future duplicate / fraud detection.
 * No automatic blocking — comparison only.
 */

export function hammingDistanceHex(a: string, b: string): number {
  const left = a.replace(/^0x/i, "").toLowerCase();
  const right = b.replace(/^0x/i, "").toLowerCase();
  const len = Math.max(left.length, right.length);
  let distance = 0;
  for (let i = 0; i < len; i++) {
    const n1 = parseInt(left[i] ?? "0", 16);
    const n2 = parseInt(right[i] ?? "0", 16);
    let x = n1 ^ n2;
    while (x) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}

/** Similarity 0–1 from hex perceptual hashes (64-bit → 16 hex chars typical). */
export function hashSimilarity(a: string, b: string, bitLength = 64): number {
  const distance = hammingDistanceHex(a, b);
  const bits = Math.max(bitLength, a.length * 4, b.length * 4);
  return Math.max(0, 1 - distance / bits);
}

export type FingerprintBundle = {
  sha256?: string | null;
  ahash?: string | null;
  dhash?: string | null;
  phash?: string | null;
};

export function compareFingerprints(
  left: FingerprintBundle,
  right: FingerprintBundle
): {
  sha256Match: boolean;
  ahashDistance: number | null;
  dhashDistance: number | null;
  phashDistance: number | null;
  ahashSimilarity: number | null;
  dhashSimilarity: number | null;
  phashSimilarity: number | null;
} {
  return {
    sha256Match: Boolean(left.sha256 && right.sha256 && left.sha256 === right.sha256),
    ahashDistance:
      left.ahash && right.ahash ? hammingDistanceHex(left.ahash, right.ahash) : null,
    dhashDistance:
      left.dhash && right.dhash ? hammingDistanceHex(left.dhash, right.dhash) : null,
    phashDistance:
      left.phash && right.phash ? hammingDistanceHex(left.phash, right.phash) : null,
    ahashSimilarity:
      left.ahash && right.ahash ? hashSimilarity(left.ahash, right.ahash) : null,
    dhashSimilarity:
      left.dhash && right.dhash ? hashSimilarity(left.dhash, right.dhash) : null,
    phashSimilarity:
      left.phash && right.phash ? hashSimilarity(left.phash, right.phash) : null,
  };
}

/** Heuristic near-duplicate threshold for phash (tune later with real corpus). */
export function isNearDuplicatePhash(distance: number, threshold = 10): boolean {
  return distance <= threshold;
}

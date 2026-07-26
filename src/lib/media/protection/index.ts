/** Yike enterprise media protection — listing photo trust infrastructure. */
export { resolveWatermarkAttribution } from "./attribution";
export {
  computeImageFingerprints,
  computeSha256,
  computeAHash,
  computeDHash,
  computePHash,
} from "./fingerprint";
export {
  compareFingerprints,
  hammingDistanceHex,
  hashSimilarity,
  isNearDuplicatePhash,
} from "./compare";
export {
  getMediaProtectionConfig,
  isMediaProtectionEnabled,
  MEDIA_PROTECTION_ARCHIVE_BUCKET,
  MEDIA_PROTECTION_PUBLIC_BUCKET,
} from "./config";
export { protectListingImage, buildProtectedStoragePaths } from "./pipeline";
export { applyProtectionWatermarks, adaptiveParamsFromSeed } from "./watermark";
export { persistMediaAsset } from "./persist";

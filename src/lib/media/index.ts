/** Yike media pipeline — every user/admin image upload must WebP-compress server-side. */
export {
  optimizeUploadedImage,
  optimizeCoverImage,
  optimizeImagePreset,
  resolveImageMime,
  readImageUploadBuffer,
  buildStoragePaths,
  buildAvatarStoragePaths,
  buildCoverStoragePaths,
  assertAvatarOutputSize,
  WEBP_CONTENT_TYPE,
  type ImagePreset,
  type OptimizedImageSet,
  type OptimizedCoverSet,
  type ProcessedWebpImage,
} from "./image";
export {
  MEDIA_LIMITS,
  PROFILE_MEDIA_LIMITS,
  IMAGE_SIZES,
  COVER_SIZES,
  IMAGE_PRESET_SIZES,
  ALLOWED_IMAGE_TYPES,
} from "./constants";
export { storeWebpObject, AD_CREATIVES_BUCKET } from "./store-webp";
export { handleAdminImageUpload } from "./admin-upload-handler";

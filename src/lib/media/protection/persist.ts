/**
 * Persist media_assets rows via service-role client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProtectListingImageResult } from "./pipeline";

export type PersistMediaAssetInput = {
  protected: ProtectListingImageResult;
  ownerId: string;
  listingId: string | null;
  listingRef: string;
  index: number;
  mimeSource: string | null;
  assetType?: "property" | "vehicle" | "other";
};

export async function persistMediaAsset(
  admin: SupabaseClient,
  input: PersistMediaAssetInput
): Promise<{ id: string; imageUuid: string } | null> {
  const p = input.protected;
  const row = {
    image_uuid: p.imageUuid,
    owner_id: input.ownerId,
    listing_id: input.listingId,
    listing_ref: input.listingRef,
    marketplace: "yike",
    asset_type: input.assetType ?? "property",
    seller_name: p.sellerName,
    company_name: p.companyName,
    watermark_label: p.watermarkLabel,
    sha256: p.fingerprints.sha256,
    phash: p.fingerprints.phash,
    dhash: p.fingerprints.dhash,
    ahash: p.fingerprints.ahash,
    original_width: p.originalWidth,
    original_height: p.originalHeight,
    processed_width: p.processedWidth,
    processed_height: p.processedHeight,
    watermark_version: p.watermarkVersion,
    pipeline_version: p.pipelineVersion,
    media_version: p.mediaVersion,
    storage_bucket_public: p.buckets.public,
    storage_bucket_archive: p.buckets.archive,
    path_thumbnail: p.paths.thumbnail,
    path_medium: p.paths.medium,
    path_large: p.paths.large,
    path_original: p.paths.original,
    index_in_listing: input.index,
    mime_source: input.mimeSource,
    bytes_original: p.archiveBuffer.byteLength,
    bytes_large: p.large.byteLength,
    protection_enabled: true,
    metadata: {
      watermark_color: p.watermarkColor,
      adaptive: p.adaptive,
    },
  };

  const { data, error } = await admin
    .from("media_assets")
    .insert(row)
    .select("id, image_uuid")
    .single();

  if (error) {
    console.error("[media_assets] persist failed", error.message);
    return null;
  }

  return { id: data.id as string, imageUuid: data.image_uuid as string };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { WEBP_CONTENT_TYPE } from "./constants";

export const AD_CREATIVES_BUCKET = "ad-creatives";

export async function storeWebpObject(
  storage: SupabaseClient["storage"],
  bucket: string,
  path: string,
  body: Buffer
): Promise<{ publicUrl: string; path: string }> {
  const { error } = await storage.from(bucket).upload(path, body, {
    contentType: WEBP_CONTENT_TYPE,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message || "Upload failed");
  }

  const { data } = storage.from(bucket).getPublicUrl(path);
  return {
    path,
    publicUrl: `${data.publicUrl}?v=${Date.now()}`,
  };
}

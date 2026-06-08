import type { SupabaseClient } from "@supabase/supabase-js";
import { applyEmailAd } from "./ad-marker";
import { resolveEmailAdHtml } from "./email-ad";

/** Inject live email sponsor chip into all consumer transactional HTML. */
export async function finalizeTransactionalEmailHtml(
  html: string,
  options?: { includeAd?: boolean; admin?: SupabaseClient | null }
): Promise<string> {
  if (options?.includeAd === false) {
    return applyEmailAd(html, "");
  }
  const adHtml = await resolveEmailAdHtml(options?.admin ?? null);
  return applyEmailAd(html, adHtml);
}

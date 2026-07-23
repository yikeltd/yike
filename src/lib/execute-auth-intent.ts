import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createClient } from "@/lib/supabase/client";
import type { AuthIntent } from "@/lib/auth-intent";
import { canListProperties } from "@/lib/utils";
import {
  isSellerReadyToList,
  SELLER_CHOOSE_LISTING_PATH,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";

export async function executeAuthIntent(
  intent: AuthIntent,
  router: AppRouterInstance
): Promise<void> {
  const supabase = createClient();

  switch (intent.type) {
    case "whatsapp":
    case "call":
      if (intent.contactUrl) {
        if (intent.type === "call") {
          window.location.href = intent.contactUrl;
        } else {
          window.open(intent.contactUrl, "_blank", "noopener,noreferrer");
        }
      }
      break;
    case "save":
      if (intent.listingId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("favorites").upsert(
            { user_id: user.id, property_id: intent.listingId },
            { onConflict: "user_id,property_id", ignoreDuplicates: true }
          );
        }
      }
      if (intent.redirectPath) router.push(intent.redirectPath);
      break;
    case "profile":
      router.push("/agent");
      break;
    case "saved":
      router.push("/saved");
      break;
    case "review_agent":
      if (intent.redirectPath) router.push(intent.redirectPath);
      break;
    case "verification_request":
      if (intent.listingId) {
        try {
          sessionStorage.setItem("yike_resume_verification", intent.listingId);
        } catch {
          /* ignore */
        }
      }
      if (intent.redirectPath) router.push(intent.redirectPath);
      break;
    case "list_property": {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) break;
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "role, verification_status, verified_badge, listing_limit, ranking_score, phone_verified, whatsapp_verification_status, whatsapp_verified_at, email_verified, date_of_birth, residential_address, office_address, residential_state, seller_profile_completed_at, is_banned, account_status, profile_status"
        )
        .eq("id", user.id)
        .single();
      if (
        profile &&
        canListProperties(profile) &&
        isSellerReadyToList(profile)
      ) {
        router.push(SELLER_CHOOSE_LISTING_PATH);
      } else {
        router.push(SELLER_VERIFY_PATH);
      }
      break;
    }
    default:
      if (intent.redirectPath) router.push(intent.redirectPath);
  }
}

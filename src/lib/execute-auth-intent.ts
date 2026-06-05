import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createClient } from "@/lib/supabase/client";
import type { AuthIntent } from "@/lib/auth-intent";
import { canListProperties } from "@/lib/utils";

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
    case "list_property": {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) break;
      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status")
        .eq("id", user.id)
        .single();
      if (profile && canListProperties(profile.verification_status)) {
        router.push("/agent/listings/new");
      } else {
        router.push("/agent/verification");
      }
      break;
    }
    default:
      if (intent.redirectPath) router.push(intent.redirectPath);
  }
}

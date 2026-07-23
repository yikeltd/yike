import { getSession, getProfile, isEmailVerified } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  isSellerReadyToList,
  SELLER_CHOOSE_LISTING_PATH,
  SELLER_VERIFY_PATH,
} from "@/lib/seller-trust";

/**
 * Legacy become-seller entry — Seller Verification & Onboarding v1
 * consolidates this into /agent/verify.
 */
export default async function BecomeAgentPage() {
  const user = await getSession();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(SELLER_VERIFY_PATH)}`);
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) {
    redirect("/");
  }

  if (!isEmailVerified(user, profile)) {
    redirect(`/auth/verify-email?next=${encodeURIComponent(SELLER_VERIFY_PATH)}`);
  }

  if (isSellerReadyToList(profile)) {
    redirect(SELLER_CHOOSE_LISTING_PATH);
  }

  redirect(SELLER_VERIFY_PATH);
}

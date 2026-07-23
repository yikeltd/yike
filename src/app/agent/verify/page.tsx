import { getSession, getProfile, isEmailVerified } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SellerVerificationClient } from "@/components/agent/seller-verification-client";
import {
  isSellerReadyToList,
  SELLER_CHOOSE_LISTING_PATH,
} from "@/lib/seller-trust";

export const metadata = {
  title: "Verify Yourself to Start Listing | Yike",
  description:
    "Verify your phone and complete a short seller profile before listing on Yike.",
};

export default async function SellerVerifyPage() {
  const user = await getSession();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent("/agent/verify")}`);
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) {
    redirect("/");
  }

  const emailOk = isEmailVerified(user, profile);
  if (!emailOk) {
    redirect(`/auth/verify-email?next=${encodeURIComponent("/agent/verify")}`);
  }

  if (isSellerReadyToList(profile)) {
    redirect(SELLER_CHOOSE_LISTING_PATH);
  }

  return (
    <SellerVerificationClient profile={profile} emailVerified={emailOk} />
  );
}

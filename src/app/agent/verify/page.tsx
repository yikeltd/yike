import { getSession, getProfile, isEmailVerified } from "@/lib/auth";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { SellerVerificationClient } from "@/components/agent/seller-verification-client";
import {
  buildSellerVerifyUrl,
  isSellerReadyToList,
  SELLER_CHOOSE_LISTING_PATH,
} from "@/lib/seller-trust";

export const metadata = {
  title: "Verify Yourself to Start Listing | Yike",
  description: "Seller verification for listing on Yike.",
};

export default async function SellerVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const returnPath = safeNextPath(sp.next, SELLER_CHOOSE_LISTING_PATH);
  const verifyReturn = buildSellerVerifyUrl(returnPath);

  const user = await getSession();
  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(verifyReturn)}`);
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned) {
    redirect("/");
  }

  const emailOk = isEmailVerified(user, profile);
  if (!emailOk) {
    redirect(`/auth/verify-email?next=${encodeURIComponent(verifyReturn)}`);
  }

  if (isSellerReadyToList(profile)) {
    redirect(returnPath);
  }

  return (
    <SellerVerificationClient
      profile={profile}
      emailVerified={emailOk}
      returnPath={returnPath}
    />
  );
}

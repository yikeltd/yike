import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSellerTrustProgress,
  isSellerProfileComplete,
  isSellerReadyToList,
  mustCompleteSellerVerification,
} from "@/lib/seller-trust/onboarding";

test("incomplete seller must complete verification before listing", () => {
  const profile = {
    email_verified: true,
    phone_verified: false,
    seller_profile_completed_at: null,
    residential_address: "",
    residential_state: "",
    date_of_birth: "",
    verification_status: "unverified" as const,
    is_banned: false,
  };
  assert.equal(isSellerProfileComplete(profile), false);
  assert.equal(isSellerReadyToList(profile), false);
  assert.equal(mustCompleteSellerVerification(profile), true);
});

test("seller with phone and profile can enter listing flow while details are checked", () => {
  const profile = {
    email_verified: true,
    phone_verified: true,
    phone_verified_at: new Date().toISOString(),
    seller_profile_completed_at: new Date().toISOString(),
    residential_address: "12 Example Rd",
    residential_state: "Lagos",
    date_of_birth: "1990-01-01",
    verification_status: "pending" as const,
    verification_submitted_at: new Date().toISOString(),
    is_banned: false,
  };
  assert.equal(isSellerReadyToList(profile), true);
  assert.equal(mustCompleteSellerVerification(profile), false);
});

test("buildSellerTrustProgress uses customer-friendly review step label", () => {
  const steps = buildSellerTrustProgress(
    {
      email_verified: true,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      seller_profile_completed_at: new Date().toISOString(),
      residential_address: "12 Example Rd",
      residential_state: "Lagos",
      date_of_birth: "1990-01-01",
      verification_status: "pending",
      verification_submitted_at: new Date().toISOString(),
    },
    { emailVerified: true }
  );
  const review = steps.find((s) => s.id === "seller_review");
  assert.equal(review?.label, "Checking your details");
});

test("buildSellerTrustProgress points to phone when email done but phone missing", () => {
  const steps = buildSellerTrustProgress(
    {
      email_verified: true,
      phone_verified: false,
      residential_address: "",
      residential_state: "",
      date_of_birth: "",
    },
    { emailVerified: true }
  );
  const current = steps.find((s) => s.current);
  assert.equal(current?.id, "phone");
});

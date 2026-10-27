import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { staticPathRedirect } from "@/lib/route-redirects";
import { buildSellerVerifyUrl } from "@/lib/seller-trust/verify-url";
import {
  isSellerReadyToList,
  mustCompleteSellerVerification,
} from "@/lib/seller-trust/onboarding";

test("sell aliases land on listing chooser (verification gated there)", () => {
  assert.equal(staticPathRedirect("/sell"), "/agent/listings/new");
  assert.equal(staticPathRedirect("/list-property"), "/agent/listings/new");
});

test("seller verify URL preserves return path", () => {
  const url = buildSellerVerifyUrl("/agent/listings/new/property");
  assert.match(url, /^\/agent\/verify\?next=/);
  assert.ok(url.includes(encodeURIComponent("/agent/listings/new/property")));
});

test("verified seller ready to list skips onboarding gate", () => {
  const profile = {
    email_verified: true,
    phone_verified: true,
    phone_verified_at: new Date().toISOString(),
    seller_profile_completed_at: new Date().toISOString(),
    residential_address: "12 Example Rd",
    residential_state: "Lagos",
    date_of_birth: "1990-01-01",
    verification_status: "approved" as const,
    verified_badge: true,
    is_banned: false,
  };
  assert.equal(isSellerReadyToList(profile), true);
  assert.equal(mustCompleteSellerVerification(profile), false);
});

test("signup finish path does not hard-code seller verification", () => {
  const signupForm = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/auth/signup/signup-form.tsx"),
    "utf8"
  );
  assert.doesNotMatch(signupForm, /\/agent\/verify/);
  const loginClient = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/auth/login/login-client.tsx"),
    "utf8"
  );
  assert.doesNotMatch(loginClient, /\/agent\/verify/);
});

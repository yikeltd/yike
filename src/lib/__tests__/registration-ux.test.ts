import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  buildSmsOtpMessage,
  SENDCHAMP_OTP_META_MESSAGE,
  PHONE_VERIFY_COPY,
} from "@/lib/phone-verification/copy";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";

test("SMS templates use Yike OTP wording with dynamic code", () => {
  assert.match(SENDCHAMP_OTP_META_MESSAGE, /Your Yike OTP is \{\{code\}\}/);
  assert.match(buildSmsOtpMessage("482910"), /Your Yike OTP is 482910/);
  assert.doesNotMatch(buildSmsOtpMessage("482910"), /371604/);
});

test("successful send uses user-facing sentSms copy not provider jargon", () => {
  assert.match(PHONE_VERIFY_COPY.sentSms, /6-digit code/i);
  const src = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/phone-verification/copy.ts"),
    "utf-8",
  );
  assert.doesNotMatch(src, /providerAcceptedSms/);
  assert.doesNotMatch(src, /SMS request accepted/i);
});

test("hasBasicListingProfile allows empty address when identity fields present", () => {
  assert.equal(
    hasBasicListingProfile({
      full_name: "Ada Lovelace",
      date_of_birth: "1990-01-15",
      residential_address: "",
      residential_state: "",
      account_type: "individual",
    }),
    true,
  );
  assert.equal(
    hasBasicListingProfile({
      full_name: "Ada Lovelace",
      date_of_birth: "1990-01-15",
      residential_address: "12 Main St",
      residential_city: "Lagos",
      residential_state: "Lagos",
      account_type: "individual",
    }),
    true,
  );
});

test("profile-setup API does not require complete address block", () => {
  const route = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/agent/profile-setup/route.ts"),
    "utf-8",
  );
  assert.doesNotMatch(route, /!residentialAddress \|\| !residentialCity/);
});

test("seller-verification API does not enforce minimum address length", () => {
  const route = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/agent/seller-verification/route.ts"),
    "utf-8",
  );
  assert.doesNotMatch(route, /house number, street, area/);
  assert.doesNotMatch(route, /residentialAddress\.length < 8/);
});

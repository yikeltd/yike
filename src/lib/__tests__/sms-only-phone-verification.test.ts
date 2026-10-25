import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { isPhoneVerifiedForSeller } from "@/lib/seller-trust";
import { resolveDefaultPhoneVerificationChannel } from "@/lib/phone-verification/channel";

const repoRoot = path.join(__dirname, "..", "..", "..");

test("default phone verification channel is sms", () => {
  assert.equal(resolveDefaultPhoneVerificationChannel(), "sms");
});

test("seller phone gate uses phone_verified only (not legacy whatsapp_verified_at)", () => {
  assert.equal(
    isPhoneVerifiedForSeller({
      phone_verified: false,
      whatsapp_verification_status: "verified",
      whatsapp_verified_at: new Date().toISOString(),
    }),
    false,
  );
  assert.equal(
    isPhoneVerifiedForSeller({
      phone_verified: true,
      whatsapp_verification_status: "unverified",
    }),
    true,
  );
});

test("WhatsApp verification routes and service are removed", () => {
  const removed = [
    "src/lib/whatsapp-verification/service.ts",
    "src/app/api/profile/whatsapp/send-code/route.ts",
    "src/app/api/profile/whatsapp/verify-code/route.ts",
    "src/components/profile/whatsapp-verify-modal.tsx",
  ];
  for (const rel of removed) {
    assert.equal(
      existsSync(path.join(repoRoot, rel)),
      false,
      `expected removed: ${rel}`,
    );
  }
});

test("feature flags do not expose WhatsApp OTP toggles", () => {
  const src = readFileSync(path.join(repoRoot, "src/lib/feature-flags.ts"), "utf8");
  assert.doesNotMatch(src, /isWhatsappOtpEnabled/);
  assert.doesNotMatch(src, /ENABLE_WHATSAPP_OTP/);
});

test("Sendchamp verification uses native HTTPS client instead of fetch", () => {
  const src = readFileSync(
    path.join(repoRoot, "src/lib/notifications/providers/sendchamp-verification.ts"),
    "utf8",
  );
  assert.match(src, /sendchampJsonPost/);
  assert.doesNotMatch(src, /await fetch\(/);
});

test("auth phone send rejects whatsapp channel", () => {
  const src = readFileSync(
    path.join(repoRoot, "src/app/api/auth/phone/send/route.ts"),
    "utf8",
  );
  assert.match(src, /body\.channel === "whatsapp"/);
});

import { isProductionEnv } from "./env";
import { isAuthSmsVerificationBypassActive } from "@/lib/auth/sms-verification-flag";
import {
  assertPinPepperProductionReady,
  getPinPepperStatus,
} from "@/lib/pin-pepper";

export type EnvCheck = {
  name: string;
  present: boolean;
  requiredInProduction: boolean;
};

const PRODUCTION_REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "CRON_SECRET",
  "YIKE_OTP_SERVER_TOKEN",
  "YIKE_PIN_PEPPER",
] as const;

const PRODUCTION_RECOMMENDED = [
  "RESEND_API_KEY",
  "SENDCHAMP_WEBHOOK_SECRET",
  "APP_ENV",
  "GIT_COMMIT_SHA",
] as const;

function present(name: string): boolean {
  if (name === "YIKE_PIN_PEPPER") {
    return getPinPepperStatus().ok;
  }
  return Boolean(process.env[name]?.trim());
}

/** Snapshot of critical env presence (no secret values). */
export function getEnvValidationSnapshot(): {
  production: boolean;
  checks: EnvCheck[];
  missingRequired: string[];
  missingRecommended: string[];
  ok: boolean;
  pinPepper: ReturnType<typeof getPinPepperStatus>;
} {
  const production = isProductionEnv();
  const pinPepper = getPinPepperStatus();
  const checks: EnvCheck[] = [
    ...PRODUCTION_REQUIRED.map((name) => ({
      name,
      present: present(name),
      requiredInProduction: true,
    })),
    ...PRODUCTION_RECOMMENDED.map((name) => ({
      name,
      present: present(name),
      requiredInProduction: false,
    })),
  ];

  const missingRequired = PRODUCTION_REQUIRED.filter((name) => !present(name));
  const missingRecommended = PRODUCTION_RECOMMENDED.filter(
    (name) => !present(name),
  );

  return {
    production,
    checks,
    missingRequired: [...missingRequired],
    missingRecommended: [...missingRecommended],
    ok: !production || missingRequired.length === 0,
    pinPepper,
  };
}

/**
 * Production startup gate.
 * PIN pepper is fail-fast (throws). Other missing required vars are logged
 * so health endpoints can still diagnose, but PIN pepper must never be weak.
 */
export function validateProductionEnvironment(): {
  ok: boolean;
  missingRequired: string[];
  missingRecommended: string[];
} {
  const snap = getEnvValidationSnapshot();
  if (!snap.production) {
    return {
      ok: true,
      missingRequired: [],
      missingRecommended: snap.missingRecommended,
    };
  }

  // Launch blocker — refuse to run production without a strong PIN pepper.
  assertPinPepperProductionReady();

  if (snap.missingRequired.length > 0) {
    console.error(
      `[yike] production env validation FAILED — missing required: ${snap.missingRequired.join(", ")}`,
    );
  }
  if (snap.missingRecommended.length > 0) {
    console.warn(
      `[yike] production env validation — missing recommended: ${snap.missingRecommended.join(", ")}`,
    );
  }
  if (snap.ok) {
    console.log("[yike] production env validation ok");
  }

  if (isAuthSmsVerificationBypassActive()) {
    console.warn(
      "[yike] AUTH_SMS_VERIFICATION_ENABLED=false — SMS bypass ACTIVE. Re-enable before public launch.",
    );
  }

  return {
    ok: snap.ok,
    missingRequired: snap.missingRequired,
    missingRecommended: snap.missingRecommended,
  };
}

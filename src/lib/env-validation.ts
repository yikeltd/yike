import { isProductionEnv } from "./env";
import { isAuthSmsVerificationBypassActive } from "@/lib/auth/sms-verification-flag";

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
] as const;

const PRODUCTION_RECOMMENDED = [
  "RESEND_API_KEY",
  "SENDCHAMP_WEBHOOK_SECRET",
  "APP_ENV",
  "GIT_COMMIT_SHA",
] as const;

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/** Snapshot of critical env presence (no secret values). */
export function getEnvValidationSnapshot(): {
  production: boolean;
  checks: EnvCheck[];
  missingRequired: string[];
  missingRecommended: string[];
  ok: boolean;
} {
  const production = isProductionEnv();
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
  };
}

/**
 * Production startup gate — logs errors for missing required vars.
 * Does not throw (keeps container bootable for health diagnostics);
 * operators must treat missing required vars as deploy failure.
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

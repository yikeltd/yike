/**
 * Prints whether navigation E2E prerequisites are satisfied (no secrets).
 * Run: npm run e2e:nav-prereqs
 */
import { consumerAuthStatus } from "../e2e/helpers/authenticated-consumer";
import { ephemeralAuthEnabled } from "../e2e/helpers/ephemeral-auth";
import { messagingFixtureStatus } from "../e2e/helpers/messaging-fixture";

const STAFF_ROLES = ["moderator", "content", "careers", "support", "tech", "admin"] as const;

function staffRoleConfigured(role: string): boolean {
  const key = role.toUpperCase();
  return Boolean(
    process.env[`E2E_STAFF_${key}_EMAIL`]?.trim() &&
      process.env[`E2E_STAFF_${key}_PASSWORD`]?.trim(),
  );
}

function projectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const m = String(url ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1]?.toLowerCase() ?? null;
}

async function main() {
  const ref = projectRef();
  const consumer = consumerAuthStatus();
  const messaging = await messagingFixtureStatus();

  console.log("Yike navigation E2E prerequisites\n");
  console.log(`Supabase project ref (from env): ${ref ?? "not set"}`);
  console.log(`Production ref blocked for ephemeral: hlpojfurfldvcxfxhveg`);
  console.log("");
  console.log("Consumer auth:", consumer.mode.toUpperCase());
  console.log(" ", consumer.reason);
  console.log("");
  console.log("Messaging seed:", messaging.ready ? "READY" : "BLOCKED");
  console.log(" ", messaging.reason);
  console.log("");
  console.log("Staff role credentials:");
  for (const role of STAFF_ROLES) {
    console.log(`  ${role}: ${staffRoleConfigured(role) ? "configured" : "missing E2E_STAFF_* env"}`);
  }
  console.log("");
  console.log("Quick start (isolated non-production Supabase):");
  console.log("  1. Copy .env.e2e.example → .env.e2e.local and apply migrations");
  console.log("  2. export E2E_ISOLATED_SUPABASE=1 && source .env.e2e.local");
  console.log("  3. export E2E_EPHEMERAL_AUTH=1");
  console.log("  4. npm run dev  # separate terminal");
  console.log("  5. PLAYWRIGHT_SKIP_SERVER=1 npx playwright test e2e/authenticated-navigation.spec.ts e2e/conversation-thread-navigation.spec.ts");
  console.log("");
  if (!ephemeralAuthEnabled() && consumer.mode === "unavailable") {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

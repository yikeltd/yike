/**
 * Prints whether navigation E2E prerequisites are satisfied (no secrets).
 * Run: npm run e2e:nav-prereqs
 * Isolated: npm run e2e:nav-prereqs:isolated  (requires .env.e2e.local)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const STAFF_ROLES = ["moderator", "content", "careers", "support", "tech", "admin"] as const;

function loadE2eLocalEnv() {
  if (process.env.E2E_ISOLATED_SUPABASE !== "1") return false;
  const path = join(process.cwd(), ".env.e2e.local");
  if (!existsSync(path)) return false;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
  return true;
}

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
  loadE2eLocalEnv();

  const { consumerAuthStatus } = await import("../e2e/helpers/authenticated-consumer");
  const { ephemeralAuthEnabled } = await import("../e2e/helpers/ephemeral-auth");
  const { messagingFixtureStatus } = await import("../e2e/helpers/messaging-fixture");

  const ref = projectRef();
  const consumer = consumerAuthStatus();
  const messaging = await messagingFixtureStatus();

  console.log("Yike navigation E2E prerequisites\n");
  const e2eFile = existsSync(join(process.cwd(), ".env.e2e.local"));
  console.log(`Supabase project ref (from env): ${ref ?? "not set"}`);
  console.log(`.env.e2e.local present: ${e2eFile ? "yes" : "no"}`);
  console.log(`E2E_ISOLATED_SUPABASE: ${process.env.E2E_ISOLATED_SUPABASE ?? "(unset)"}`);
  console.log(`Production ref blocked for ephemeral: hlpojfurfldvcxfxhveg`);
  if (process.env.E2E_ISOLATED_SUPABASE === "1" && !e2eFile) {
    console.log("");
    console.log("FAIL: E2E_ISOLATED_SUPABASE=1 requires .env.e2e.local (cp .env.e2e.example).");
    process.exitCode = 1;
  } else if (ref === "hlpojfurfldvcxfxhveg" && process.env.E2E_ISOLATED_SUPABASE === "1") {
    console.log("");
    console.log("FAIL: E2E_ISOLATED_SUPABASE=1 but URL still production — fix .env.e2e.local URLs.");
    process.exitCode = 1;
  } else if (ref === "hlpojfurfldvcxfxhveg") {
    console.log("");
    console.log("WARN: Default .env.local is production. Use isolated E2E env (see below).");
  }
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
  console.log("Isolated setup (required for authenticated nav + thread E2E):");
  console.log("  1. Create a NEW Supabase project (not hlpojfurfldvcxfxhveg; gyxemepnrkwxocgzfbeo is retired)");
  console.log("  2. cp .env.e2e.example .env.e2e.local — fill keys; E2E_EXPECTED_REF=<new-ref>");
  console.log("  3. Apply migrations: supabase link --project-ref <ref> && supabase db push");
  console.log("  4. npm run verify:e2e-supabase");
  console.log("  5. E2E_ISOLATED_SUPABASE=1 E2E_EPHEMERAL_AUTH=1 npm run test:e2e:navigation");
  console.log("");
  if (!ephemeralAuthEnabled() && consumer.mode === "unavailable") {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

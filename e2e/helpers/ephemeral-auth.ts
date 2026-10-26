/**
 * Disposable Playwright consumer — create/delete only when explicitly enabled.
 * Never targets production Supabase (hlpojfurfldvcxfxhveg).
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function loadEnvFile(relativePath: string, onlyMissing: boolean) {
  const path = join(repoRoot, relativePath);
  if (!existsSync(path)) return false;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
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
    if (onlyMissing && process.env[key]) continue;
    process.env[key] = val;
  }
  return true;
}

function loadEnvLocalIfNeeded() {
  if (process.env.E2E_ISOLATED_SUPABASE === "1") {
    loadEnvFile(".env.e2e.local", false);
    return;
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return;
  }
  loadEnvFile(".env.local", true);
}

loadEnvLocalIfNeeded();

const PRODUCTION_REF = "hlpojfurfldvcxfxhveg";
const EMAIL_DOMAIN = "ephemeral.yike.test";

function projectRefFromUrl(url: string | undefined) {
  const m = String(url ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1]?.toLowerCase() ?? null;
}

export function ephemeralAuthEnabled() {
  if (process.env.E2E_EPHEMERAL_AUTH !== "1") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return false;
  const ref = projectRefFromUrl(url);
  if (!ref || ref === PRODUCTION_REF) return false;
  return true;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials for ephemeral E2E");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function randomPassword() {
  return randomBytes(18).toString("base64url").slice(0, 24);
}

export type EphemeralSavedUser = {
  email: string;
  password: string;
  userId: string;
};

export async function createEphemeralSavedEmptyUser(): Promise<EphemeralSavedUser | null> {
  if (!ephemeralAuthEnabled()) return null;

  const admin = adminClient();
  const tag = randomBytes(6).toString("hex");
  const email = `e2e.saved.empty+${tag}@${EMAIL_DOMAIN}`;
  const password = randomPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "E2E Saved Empty" },
  });

  if (error || !data.user?.id) {
    throw new Error(`Ephemeral user create failed: ${error?.message ?? "no user"}`);
  }

  const userId = data.user.id;

  const { count } = await admin
    .from("favorites")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0) {
    await admin.from("favorites").delete().eq("user_id", userId);
  }

  return { email, password, userId };
}

export async function deleteEphemeralUser(userId: string) {
  if (!userId || !ephemeralAuthEnabled()) return;
  const admin = adminClient();
  await admin.auth.admin.deleteUser(userId);
}

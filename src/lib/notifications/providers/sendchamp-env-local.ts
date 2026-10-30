import fs from "node:fs";
import path from "node:path";
import { isProductionEnv } from "@/lib/env";

const SENDCHAMP_ENV_NAMES = ["SENDCHAMP_API_KEY", "SENDCHAMP_PUBLIC_KEY"] as const;

/** Parse Sendchamp keys from `.env.local` without `$` expansion (shell-safe). */
export function parseSendchampKeysFromEnvLocal(
  envLocalPath = path.join(process.cwd(), ".env.local")
): Map<(typeof SENDCHAMP_ENV_NAMES)[number], string> {
  const out = new Map<(typeof SENDCHAMP_ENV_NAMES)[number], string>();
  if (!fs.existsSync(envLocalPath)) return out;

  for (const line of fs.readFileSync(envLocalPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq) as (typeof SENDCHAMP_ENV_NAMES)[number];
    if (!SENDCHAMP_ENV_NAMES.includes(name)) continue;

    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) out.set(name, value);
  }

  return out;
}

/**
 * Local dev: parent-shell `SENDCHAMP_*` overrides Next `.env.local` and can truncate
 * values that contain `$` (e.g. Sendchamp live keys). Prefer the longer `.env.local` value.
 */
export function hydrateSendchampKeysForLocalDev(): void {
  if (isProductionEnv()) return;

  const fromFile = parseSendchampKeysFromEnvLocal();
  for (const name of SENDCHAMP_ENV_NAMES) {
    const fileValue = fromFile.get(name)?.trim();
    if (!fileValue) continue;

    const current = process.env[name]?.trim() ?? "";
    if (!current || fileValue.length > current.length) {
      process.env[name] = fileValue;
    }
  }
}

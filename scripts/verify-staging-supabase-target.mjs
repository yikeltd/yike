#!/usr/bin/env node
/**
 * @deprecated Former staging guard (gyxemepnrkwxocgzfbeo). Use verify-dev-supabase-target.mjs.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const devScript = join(root, "scripts/verify-dev-supabase-target.mjs");
const requireDev = process.argv.includes("--require-staging") || process.argv.includes("--require-dev");
const args = [devScript];
if (requireDev) args.push("--require-dev");

console.warn(
  "verify-staging-supabase-target.mjs is deprecated (retired sandbox gyxemepnrkwxocgzfbeo).",
);
console.warn("Using verify-dev-supabase-target.mjs instead.\n");

const result = spawnSync(process.execPath, args, { stdio: "inherit", cwd: root });
process.exit(result.status ?? 1);

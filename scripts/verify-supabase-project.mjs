#!/usr/bin/env node
/**
 * Supabase migration guard — verifies repository identity matches linked Supabase project.
 * Does not run migrations or touch databases.
 *
 * Usage:
 *   node scripts/verify-supabase-project.mjs
 *   node scripts/verify-supabase-project.mjs --require-linked
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const requireLinked = process.argv.includes("--require-linked");

function readProjectIdFromConfigToml(path) {
  if (!existsSync(path)) return null;
  const content = readFileSync(path, "utf8");
  const match = content.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  return match?.[1]?.trim() ?? null;
}

function readLinkedProjectRef(path) {
  if (!existsSync(path)) return null;
  const value = readFileSync(path, "utf8").trim();
  return value || null;
}

function parseIdentityMarkdown(path) {
  if (!existsSync(path)) return null;
  const md = readFileSync(path, "utf8");

  function tableField(label) {
    const patterns = [
      new RegExp(`\\*\\*${label}\\*\\*\\s*\\|\\s*\`([^\`]+)\``, "i"),
      new RegExp(`\\*\\*${label}\\*\\*\\s*\\|\\s*([^|\\n]+)`, "i")
    ];
    for (const pattern of patterns) {
      const match = md.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return null;
  }

  return {
    applicationName: tableField("applicationName"),
    applicationId: tableField("applicationId"),
    repository: tableField("repository")?.replace(/^`|`$/g, ""),
    supabaseProjectRef: tableField("Supabase ref") ?? tableField("supabaseProjectRef"),
    supabaseOrganization: tableField("Organization") ?? tableField("supabaseOrganization"),
    supabaseEnvironment: tableField("Environment") ?? tableField("supabaseEnvironment"),
    defaultDomain: tableField("defaultDomain")
  };
}

async function loadProjectIdentity() {
  try {
    const mod = await import(join(root, "server/applicationIdentity.js"));
    if (mod.APPLICATION_IDENTITY?.supabaseProjectRef) {
      return mod.APPLICATION_IDENTITY;
    }
  } catch {
    // Fall through to markdown identity for non-Node server layouts.
  }

  try {
    const mod = await import(join(root, "src/lib/application-identity.ts"));
    if (mod.APPLICATION_IDENTITY?.supabaseProjectRef) {
      return mod.APPLICATION_IDENTITY;
    }
  } catch {
    // TypeScript modules require compilation; use markdown fallback.
  }

  const fromMarkdown = parseIdentityMarkdown(join(root, "docs/engineering/PROJECT_IDENTITY.md"));
  if (fromMarkdown?.supabaseProjectRef) {
    return fromMarkdown;
  }

  throw new Error("Could not load project identity. Update docs/engineering/PROJECT_IDENTITY.md.");
}

function detectRepository() {
  try {
    const remote = execSync("git remote get-url origin", { cwd: root, encoding: "utf8" }).trim();
    const match = remote.match(/[:/\\]([^/]+)\/([^/.]+?)(?:\.git)?$/);
    return match ? `${match[1]}/${match[2]}` : null;
  } catch {
    return null;
  }
}

function normalizeRepo(value) {
  return String(value || "")
    .trim()
    .replace(/^`|`$/g, "")
    .toLowerCase();
}

function printReport({ identity, detectedRepository, configProjectRef, linkedProjectRef, errors }) {
  const expected = identity.supabaseProjectRef;
  const detected = linkedProjectRef ?? configProjectRef ?? "not linked";

  console.log("Supabase Migration Guard");
  console.log("========================");
  console.log(`Repository:        ${identity.repository || detectedRepository || "unknown"}`);
  console.log(`Application:       ${identity.applicationName || identity.applicationId || "unknown"}`);
  console.log(`Organization:      ${identity.supabaseOrganization || "unknown"}`);
  console.log(`Environment:       ${identity.supabaseEnvironment || "production"}`);
  console.log(`Canonical Domain:  ${identity.defaultDomain || "unknown"}`);
  console.log(`Expected Project:  ${expected}`);
  console.log(`config.toml:       ${configProjectRef ?? "(missing)"}`);
  console.log(`.temp/project-ref: ${linkedProjectRef ?? "(missing)"}`);
  console.log(`Detected Project:  ${detected}`);
  console.log(`Status:            ${errors.length === 0 ? "PASS" : "FAIL"}`);

  if (errors.length > 0) {
    console.error("");
    console.error("❌ Wrong Supabase project detected.");
    console.error("");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    console.error("");
    console.error("Expected:");
    console.error(`  ${expected}`);
    console.error("Found:");
    if (configProjectRef && configProjectRef !== expected) {
      console.error(`  config.toml → ${configProjectRef}`);
    }
    if (linkedProjectRef && linkedProjectRef !== expected) {
      console.error(`  .temp/project-ref → ${linkedProjectRef}`);
    }
    if (!configProjectRef) {
      console.error("  config.toml → (missing project_id)");
    }
    if (requireLinked && !linkedProjectRef) {
      console.error("  .temp/project-ref → (missing — run supabase link for this repo only)");
    }
    console.error("");
    console.error("Abort migration. Relink with the correct project ref from PROJECT_IDENTITY.md.");
  }
}

async function main() {
  const identity = await loadProjectIdentity();
  const expected = identity.supabaseProjectRef;
  if (!expected) {
    console.error("❌ Project identity is missing supabaseProjectRef.");
    process.exit(1);
  }

  const configPath = join(root, "supabase/config.toml");
  const linkedPath = join(root, "supabase/.temp/project-ref");
  const configProjectRef = readProjectIdFromConfigToml(configPath);
  const linkedProjectRef = readLinkedProjectRef(linkedPath);
  const detectedRepository = detectRepository();
  const errors = [];

  if (detectedRepository && identity.repository) {
    if (normalizeRepo(detectedRepository) !== normalizeRepo(identity.repository)) {
      errors.push(
        `Repository mismatch: expected ${identity.repository}, detected ${detectedRepository}`
      );
    }
  }

  if (!configProjectRef) {
    errors.push("Missing supabase/config.toml project_id for this repository.");
  } else if (configProjectRef !== expected) {
    errors.push(`config.toml project_id mismatch: expected ${expected}, found ${configProjectRef}`);
  }

  if (requireLinked && !linkedProjectRef) {
    errors.push("Supabase CLI is not linked (.temp/project-ref missing).");
  }

  if (linkedProjectRef && linkedProjectRef !== expected) {
    errors.push(
      `.temp/project-ref mismatch: expected ${expected}, found ${linkedProjectRef}`
    );
  }

  printReport({ identity, detectedRepository, configProjectRef, linkedProjectRef, errors });
  process.exit(errors.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("❌ Supabase migration guard failed:", error.message || error);
  process.exit(1);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  hydrateSendchampKeysForLocalDev,
  parseSendchampKeysFromEnvLocal,
} from "@/lib/notifications/providers/sendchamp-env-local";

test("parseSendchampKeysFromEnvLocal preserves dollar signs in quoted values", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yike-sendchamp-env-"));
  const envPath = path.join(dir, ".env.local");
  fs.writeFileSync(
    envPath,
    "SENDCHAMP_API_KEY='sendchamp_live_$2a$10$full'\nSENDCHAMP_PUBLIC_KEY=ignored\n",
    "utf8"
  );

  const parsed = parseSendchampKeysFromEnvLocal(envPath);
  assert.equal(parsed.get("SENDCHAMP_API_KEY"), "sendchamp_live_$2a$10$full");
});

test("hydrateSendchampKeysForLocalDev replaces truncated shell exports", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "yike-sendchamp-hydrate-"));
  const envPath = path.join(dir, ".env.local");
  const full = "sendchamp_live_$2a$10$full_access_key_value";
  fs.writeFileSync(envPath, `SENDCHAMP_API_KEY='${full}'\n`, "utf8");

  const saved = process.env.APP_ENV;
  const savedApi = process.env.SENDCHAMP_API_KEY;
  const savedCwd = process.cwd();
  try {
    process.env.APP_ENV = "development";
    process.env.SENDCHAMP_API_KEY = "sendchamp_live_short";
    process.chdir(dir);
    hydrateSendchampKeysForLocalDev();
    assert.equal(process.env.SENDCHAMP_API_KEY, full);
  } finally {
    process.chdir(savedCwd);
    if (saved === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = saved;
    if (savedApi === undefined) delete process.env.SENDCHAMP_API_KEY;
    else process.env.SENDCHAMP_API_KEY = savedApi;
  }
});

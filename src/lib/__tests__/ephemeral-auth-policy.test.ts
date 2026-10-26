import test from "node:test";
import assert from "node:assert/strict";
import {
  ephemeralAuthFlagAllowed,
  isProductionDeploymentRuntime,
} from "@/lib/e2e/ephemeral-auth-policy";

test("ephemeral auth flag is disabled on production VERCEL_ENV", () => {
  const prevVercel = process.env.VERCEL_ENV;
  const prevFlag = process.env.E2E_EPHEMERAL_AUTH;
  try {
    process.env.VERCEL_ENV = "production";
    process.env.E2E_EPHEMERAL_AUTH = "1";
    assert.equal(isProductionDeploymentRuntime(), true);
    assert.equal(ephemeralAuthFlagAllowed(), false);
  } finally {
    if (prevVercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercel;
    if (prevFlag === undefined) delete process.env.E2E_EPHEMERAL_AUTH;
    else process.env.E2E_EPHEMERAL_AUTH = prevFlag;
  }
});

test("ephemeral auth flag allowed when not production deployment", () => {
  const prevVercel = process.env.VERCEL_ENV;
  const prevFlag = process.env.E2E_EPHEMERAL_AUTH;
  try {
    delete process.env.VERCEL_ENV;
    process.env.E2E_EPHEMERAL_AUTH = "1";
    assert.equal(ephemeralAuthFlagAllowed(), true);
  } finally {
    if (prevVercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevVercel;
    if (prevFlag === undefined) delete process.env.E2E_EPHEMERAL_AUTH;
    else process.env.E2E_EPHEMERAL_AUTH = prevFlag;
  }
});

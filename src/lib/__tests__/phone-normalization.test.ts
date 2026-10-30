import assert from "node:assert/strict";
import test from "node:test";
import { toSendchampPhone } from "@/lib/notifications/providers/sendchamp";
import {
  canRequestPhoneOtp,
  isBasicPhoneFormat,
  isLocalNigerianSignupPhone,
  isValidNigerianPhone,
  normalizePhoneForDuplicateCheck,
  normalizeWhatsappInput,
  parseNigerianPhone,
  sanitizeNigerianPhoneFieldInput,
  toInternationalNigerianPhone,
} from "@/lib/phone";

const LOCAL = "08012345678";
const INTL = "2348012345678";

test("parseNigerianPhone accepts 08012345678 and formatted local variants", () => {
  assert.deepEqual(parseNigerianPhone(LOCAL), {
    local11: LOCAL,
    intl13: INTL,
  });
  assert.deepEqual(parseNigerianPhone("0801 234-5678"), {
    local11: LOCAL,
    intl13: INTL,
  });
  assert.equal(parseNigerianPhone("0801 234 567"), null);
});

test("parseNigerianPhone accepts +234 and 234 international forms", () => {
  assert.deepEqual(parseNigerianPhone("+2348012345678"), {
    local11: LOCAL,
    intl13: INTL,
  });
  assert.deepEqual(parseNigerianPhone("2348012345678"), {
    local11: LOCAL,
    intl13: INTL,
  });
  assert.deepEqual(parseNigerianPhone("+234 801 234 5678"), {
    local11: LOCAL,
    intl13: INTL,
  });
});

test("parseNigerianPhone rejects invalid prefixes and lengths", () => {
  assert.equal(parseNigerianPhone("06012345678"), null);
  assert.equal(parseNigerianPhone("0801234567"), null);
  assert.equal(parseNigerianPhone("080123456789"), null);
  assert.equal(parseNigerianPhone("12345678901"), null);
  assert.equal(parseNigerianPhone("+234801234567"), null);
  assert.equal(parseNigerianPhone("23480123456789"), null);
});

test("equivalent formats normalize to the same canonical duplicate identity", () => {
  assert.equal(normalizePhoneForDuplicateCheck(LOCAL), INTL);
  assert.equal(normalizePhoneForDuplicateCheck("+2348012345678"), INTL);
  assert.equal(normalizePhoneForDuplicateCheck("2348012345678"), INTL);
  assert.equal(normalizePhoneForDuplicateCheck("8012345678"), INTL);
});

test("canRequestPhoneOtp accepts local and international Nigerian forms", () => {
  assert.equal(canRequestPhoneOtp(LOCAL), true);
  assert.equal(canRequestPhoneOtp("+234 801 234 5678"), true);
  assert.equal(canRequestPhoneOtp("2348012345678"), true);
  assert.equal(canRequestPhoneOtp("06012345678"), false);
});

test("signup validation matches parseNigerianPhone", () => {
  assert.equal(isLocalNigerianSignupPhone(LOCAL), true);
  assert.equal(isLocalNigerianSignupPhone("+2348012345678"), true);
  assert.equal(isLocalNigerianSignupPhone("8012345678"), false);
  assert.equal(isBasicPhoneFormat("8012345678"), true);
});

test("normalizeWhatsappInput stores local 11-digit form", () => {
  assert.equal(normalizeWhatsappInput("+2348012345678"), LOCAL);
  assert.equal(normalizeWhatsappInput(LOCAL), LOCAL);
});

test("Sendchamp payload uses 234 international, not raw local", () => {
  assert.equal(toInternationalNigerianPhone(LOCAL), INTL);
  assert.equal(toSendchampPhone(LOCAL), INTL);
  assert.equal(toSendchampPhone("+2348012345678"), INTL);
});

test("sanitizeNigerianPhoneFieldInput keeps +234 entry paths", () => {
  assert.equal(sanitizeNigerianPhoneFieldInput("+2348012345678"), "+2348012345678");
  assert.equal(sanitizeNigerianPhoneFieldInput("08012345678"), "08012345678");
});

test("Nigerian local prefixes validate at 11 digits", () => {
  assert.equal(isValidNigerianPhone("08031234567"), true);
  assert.equal(isValidNigerianPhone("09012345678"), true);
  assert.equal(isValidNigerianPhone("06012345678"), false);
  assert.equal(isValidNigerianPhone("0803123456"), false);
});

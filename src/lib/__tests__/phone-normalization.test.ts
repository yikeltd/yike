import assert from "node:assert/strict";
import test from "node:test";
import {
  canRequestPhoneOtp,
  isBasicPhoneFormat,
  isLocalNigerianSignupPhone,
  isValidNigerianPhone,
  normalizePhoneForDuplicateCheck,
  normalizeWhatsappInput,
  toInternationalNigerianPhone,
} from "@/lib/phone";

test("Nigerian local prefixes validate at 11 digits", () => {
  assert.equal(isValidNigerianPhone("08031234567"), true);
  assert.equal(isValidNigerianPhone("09012345678"), true);
  assert.equal(isValidNigerianPhone("06012345678"), false);
  assert.equal(isValidNigerianPhone("0803123456"), false);
});

test("toInternationalNigerianPhone accepts local and +234 forms", () => {
  assert.equal(toInternationalNigerianPhone("08031234567"), "2348031234567");
  assert.equal(toInternationalNigerianPhone("+234 803 123 4567"), "2348031234567");
  assert.equal(toInternationalNigerianPhone("2348031234567"), "2348031234567");
  assert.equal(toInternationalNigerianPhone("8031234567"), null);
});

test("normalizePhoneForDuplicateCheck treats equivalent formats as one identity", () => {
  assert.equal(normalizePhoneForDuplicateCheck("08031234567"), "2348031234567");
  assert.equal(normalizePhoneForDuplicateCheck("8031234567"), "2348031234567");
  assert.equal(normalizePhoneForDuplicateCheck("+2348031234567"), "2348031234567");
  assert.equal(normalizePhoneForDuplicateCheck("2348031234567"), "2348031234567");
});

test("normalizeWhatsappInput stores local 11-digit form", () => {
  assert.equal(normalizeWhatsappInput("+2348031234567"), "08031234567");
});

test("signup phone is stricter than basic format", () => {
  assert.equal(isBasicPhoneFormat("8031234567"), true);
  assert.equal(isLocalNigerianSignupPhone("8031234567"), false);
  assert.equal(isLocalNigerianSignupPhone("08031234567"), true);
});

test("canRequestPhoneOtp aligns with valid Nigerian local numbers", () => {
  assert.equal(canRequestPhoneOtp("08031234567"), true);
  assert.equal(canRequestPhoneOtp("2348031234567"), false);
});

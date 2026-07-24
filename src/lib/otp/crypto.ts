import { createHash, randomInt } from "crypto";
import { OTP_LENGTH } from "./constants";

export function generateOtp(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  // randomInt max is exclusive — include full 6-digit range (100000–999999).
  const maxExclusive = 10 ** OTP_LENGTH;
  return String(randomInt(min, maxExclusive));
}

export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export function verifyOtpHash(otp: string, hash: string): boolean {
  return hashOtp(otp) === hash;
}

export function generateVerificationToken(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${randomInt(1e9, 1e10)}`)
    .digest("hex");
}

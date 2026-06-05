import { createHash, randomInt } from "crypto";
import { OTP_LENGTH } from "./constants";

export function generateOtp(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(randomInt(min, max));
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

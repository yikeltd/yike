import { createHash, randomInt } from "crypto";

export function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export function verifyOtp(otp: string, hash: string): boolean {
  return hashOtp(otp) === hash;
}

export function generateVerificationToken(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${randomInt(1e9, 1e10)}`)
    .digest("hex");
}

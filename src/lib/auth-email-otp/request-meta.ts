import { createHash } from "crypto";

function hashValue(value: string): string {
  const salt = process.env.YIKE_OTP_SERVER_TOKEN?.trim() ?? "yike-otp";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function clientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

export function hashClientIp(request: Request): string | null {
  const ip = clientIpFromRequest(request);
  return ip ? hashValue(`ip:${ip}`) : null;
}

export function hashUserAgent(request: Request): string | null {
  const ua = request.headers.get("user-agent")?.trim();
  return ua ? hashValue(`ua:${ua}`) : null;
}

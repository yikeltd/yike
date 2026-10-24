import { createHash } from "crypto";
import { clientIpFromRequest as trustedClientIpFromRequest } from "@/lib/http/trusted-client-ip";

function hashValue(value: string): string {
  const salt = process.env.YIKE_OTP_SERVER_TOKEN?.trim() ?? "yike-otp";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function clientIpFromRequest(request: Request): string | null {
  return trustedClientIpFromRequest(request);
}

export function hashClientIp(request: Request): string | null {
  const ip = clientIpFromRequest(request);
  return ip ? hashValue(`ip:${ip}`) : null;
}

export function hashUserAgent(request: Request): string | null {
  const ua = request.headers.get("user-agent")?.trim();
  return ua ? hashValue(`ua:${ua}`) : null;
}

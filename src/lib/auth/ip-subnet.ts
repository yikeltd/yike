import { createHash } from "crypto";

function hashIpDigest(ip: string): string {
  return createHash("sha256").update(ip.trim()).digest("hex").slice(0, 32);
}

/** Coarse subnet — mobile IP changes within subnet should not revoke trust. */
export function hashIpSubnet(ip: string | null): string | null {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    return createHash("sha256")
      .update(parts.slice(0, 4).join(":"))
      .digest("hex")
      .slice(0, 32);
  }
  const octets = trimmed.split(".");
  if (octets.length < 3) return hashIpDigest(trimmed);
  return createHash("sha256")
    .update(octets.slice(0, 3).join("."))
    .digest("hex")
    .slice(0, 32);
}

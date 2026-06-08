import type { FeeTransparencyMode } from "@/types/database";

export function parseFeeValue(
  raw: string,
  mode: FeeTransparencyMode
): number | undefined {
  if (mode === "negotiable" || mode === "landlord" || mode === "not_fixed") {
    return undefined;
  }
  const s = raw.trim().replace(/[₦,\s]/g, "");
  if (!s) return undefined;
  if (mode === "percent") {
    const n = parseFloat(s.replace("%", ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

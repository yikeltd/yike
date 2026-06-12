import type { FeeTransparencyMode } from "@/types/database";
import { parseNairaAmount } from "@/lib/naira-input";

export function parseFeeValue(
  raw: string,
  mode: FeeTransparencyMode
): number | undefined {
  if (mode === "negotiable" || mode === "landlord" || mode === "not_fixed") {
    return undefined;
  }
  const trimmed = raw.trim();
  const s = trimmed.replace(/[₦,\s]/g, "");
  if (!s) return undefined;
  if (mode === "percent" || trimmed.includes("%")) {
    const match = s.match(/(\d+(?:\.\d+)?)\s*%/);
    const n = match ? parseFloat(match[1]) : parseFloat(s.replace("%", ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return parseNairaAmount(s) ?? undefined;
}

import type { ValuationSubject } from "@/lib/valuation/types";

export const VALUATION_ENGINE_VERSION = "statistical_v1";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundMoney(value: number): number {
  return Math.round(value);
}

export function readNumber(
  attributes: Record<string, unknown>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const raw = attributes[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const parsed = Number(raw.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

export function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 1;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 1;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function weightedMedian(
  items: { value: number; weight: number }[]
): number {
  if (items.length === 0) return 0;

  const sorted = [...items].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
      ? sorted[mid].value
      : (sorted[mid - 1].value + sorted[mid].value) / 2;
  }

  let cumulative = 0;
  for (const item of sorted) {
    cumulative += item.weight;
    if (cumulative >= totalWeight / 2) return item.value;
  }

  return sorted[sorted.length - 1].value;
}

export function subjectVertical(subject: ValuationSubject): string {
  const assetType = subject.attributes.assetType ?? subject.attributes.asset_type;
  if (assetType === "AUTO" || assetType === "auto") return "vehicle";
  return "property";
}

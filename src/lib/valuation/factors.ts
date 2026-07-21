import type { ValuationSubject } from "@/lib/valuation/types";
import { clamp } from "@/lib/valuation/formulas";

export function attributeCompleteness(subject: ValuationSubject): number {
  const attrs = subject.attributes;
  const keys = ["year", "mileage", "bedrooms", "bathrooms", "landSize", "condition"];
  const filled = keys.filter((key) => {
    const value = attrs[key];
    return value !== undefined && value !== null && value !== "";
  }).length;

  return clamp(filled / keys.length, 0, 1);
}

export function conditionMultiplier(condition?: string): number {
  switch ((condition ?? "").toUpperCase()) {
    case "BRAND_NEW":
    case "NEW":
      return 1.08;
    case "TOKUNBO":
      return 1;
    case "NIGERIAN_USED":
    case "USED":
      return 0.92;
    case "EXCELLENT":
      return 1.05;
    case "GOOD":
      return 1;
    case "FAIR":
      return 0.9;
    case "POOR":
      return 0.8;
    default:
      return 1;
  }
}

export function yearDepreciationMultiplier(year: number): number {
  if (!year || year <= 0) return 1;
  const age = new Date().getFullYear() - year;
  if (age <= 0) return 1;
  return clamp(1 - age * 0.05, 0.4, 1);
}

export function mileageMultiplier(mileage: number, vertical: string): number {
  if (vertical !== "vehicle" || !mileage || mileage <= 0) return 1;
  if (mileage < 50_000) return 1.02;
  if (mileage < 100_000) return 1;
  if (mileage < 200_000) return 0.95;
  return 0.88;
}

export function bedroomMultiplier(
  bedrooms: number,
  compMedian: number | null
): number {
  if (!bedrooms || bedrooms <= 0) return 1;
  if (!compMedian || compMedian <= 0) return 1;
  return clamp(1 + (bedrooms - compMedian) * 0.03, 0.85, 1.15);
}

export function bathroomMultiplier(
  bathrooms: number,
  compMedian: number | null
): number {
  if (!bathrooms || bathrooms <= 0) return 1;
  if (!compMedian || compMedian <= 0) return 1;
  return clamp(1 + (bathrooms - compMedian) * 0.02, 0.9, 1.1);
}

export function landSizeMultiplier(landSqm: number, vertical: string): number {
  if (vertical !== "property" || !landSqm || landSqm <= 0) return 1;
  if (landSqm >= 1000) return 1.05;
  if (landSqm >= 500) return 1.02;
  return 1;
}

export function featureMultiplier(featureCount: number): number {
  return clamp(1 + featureCount * 0.005, 1, 1.08);
}

export function verificationMultiplier(status?: string): number {
  switch ((status ?? "").toUpperCase()) {
    case "PREMIUM_VERIFIED":
    case "PREMIUM":
      return 1.03;
    case "VERIFIED":
      return 1.01;
    default:
      return 1;
  }
}

export function trustMultiplier(score?: number): number {
  if (typeof score !== "number" || !Number.isFinite(score)) return 1;
  return clamp(0.95 + (score / 100) * 0.08, 0.95, 1.05);
}

export function marketTrendMultiplier(liquidityRatio?: number): number {
  if (typeof liquidityRatio !== "number" || !Number.isFinite(liquidityRatio)) {
    return 1;
  }
  return clamp(1 + (liquidityRatio - 1) * 0.02, 0.95, 1.05);
}

import type { FieldOption } from "../types";

export function bedroomCountOptions(max = 12): FieldOption[] {
  return Array.from({ length: max + 1 }, (_, n) => ({
    value: String(n),
    label: n === 0 ? "Studio / 0" : String(n),
  }));
}

export function vehicleYearOptions(from = 1980): FieldOption[] {
  const current = new Date().getFullYear();
  const out: FieldOption[] = [];
  for (let y = current + 1; y >= from; y--) {
    out.push({ value: String(y), label: String(y) });
  }
  return out;
}

export const PHONE_STORAGE_GB: FieldOption[] = [
  { value: "32", label: "32 GB" },
  { value: "64", label: "64 GB" },
  { value: "128", label: "128 GB" },
  { value: "256", label: "256 GB" },
  { value: "512", label: "512 GB" },
  { value: "1024", label: "1 TB" },
];

export const DEVICE_RAM_GB: FieldOption[] = [
  { value: "2", label: "2 GB" },
  { value: "4", label: "4 GB" },
  { value: "6", label: "6 GB" },
  { value: "8", label: "8 GB" },
  { value: "12", label: "12 GB" },
  { value: "16", label: "16 GB" },
  { value: "32", label: "32 GB" },
];

export const TV_SCREEN_INCHES: FieldOption[] = [
  "32",
  "40",
  "43",
  "50",
  "55",
  "65",
  "75",
  "85",
].map((n) => ({ value: n, label: `${n}"` }));

export const GENERATOR_KVA: FieldOption[] = [
  "1.2",
  "2.5",
  "3.5",
  "5.5",
  "7.5",
  "10",
  "15",
  "20",
].map((n) => ({ value: n, label: `${n} kVA` }));

export const FRIDGE_LITERS: FieldOption[] = [
  "150",
  "200",
  "250",
  "350",
  "450",
  "550",
  "650",
].map((n) => ({ value: n, label: `${n} L` }));

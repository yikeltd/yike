import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import {
  getAllCitiesComplete,
  getAllCitiesForState,
  getStateDisplayLabel,
  getStates,
} from "@/lib/constants";
import type { ThemedSelectOption } from "@/components/ui/themed-select";

/** Static ranking — swap for API-driven scores later (trending, recents, geo). */
export const POPULAR_STATE_KEYS = [
  "Lagos",
  "FCT",
  "Rivers",
  "Ogun",
  "Oyo",
] as const;

export const POPULAR_CITY_KEYS_NATIONWIDE = [
  "Lekki",
  "Ikeja",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
] as const;

/** Per-state high-traffic localities — extend as search analytics mature. */
export const POPULAR_CITIES_BY_STATE: Record<string, readonly string[]> = {
  Lagos: ["Lekki", "Ikeja", "Yaba", "Ajah", "Surulere"],
  FCT: ["Abuja", "Wuse", "Gwarinpa", "Lugbe", "Kubwa"],
  Rivers: ["Port Harcourt", "GRA", "Rumuola", "Woji", "Trans Amadi"],
  Ogun: ["Abeokuta", "Ota", "Sango", "Mowe", "Ifo"],
  Oyo: ["Ibadan", "Bodija", "Ring Road", "Challenge", "Mokola"],
};

const POPULAR_PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: "flat", label: "1 Bedroom Flat" },
  { value: "flat_2", label: "2 Bedroom Flat" },
  { value: "flat_3", label: "3 Bedroom Flat" },
  { value: "self_contain", label: "Self Contain" },
  { value: "shop", label: "Shop" },
];

function prioritizeStrings(
  popularOrder: readonly string[],
  items: string[]
): string[] {
  const itemSet = new Set(items);
  const popular = popularOrder.filter((p) => itemSet.has(p));
  const popularSet = new Set(popularOrder);
  const rest = items
    .filter((item) => !popularSet.has(item))
    .sort((a, b) => a.localeCompare(b));
  return [...popular, ...rest];
}

function getPopularCityOrder(state?: string): readonly string[] {
  if (state && POPULAR_CITIES_BY_STATE[state]) {
    return POPULAR_CITIES_BY_STATE[state];
  }
  if (state) {
    const inState = new Set(getAllCitiesForState(state));
    return POPULAR_CITY_KEYS_NATIONWIDE.filter((city) => inState.has(city));
  }
  return POPULAR_CITY_KEYS_NATIONWIDE;
}

function buildGroupedOptions(
  placeholder: string,
  popularHeader: string,
  allHeader: string,
  popular: { value: string; label: string }[],
  all: { value: string; label: string }[],
  opts?: { includePlaceholder?: boolean }
): ThemedSelectOption[] {
  const popularValues = new Set(popular.map((p) => p.value));
  const remaining = all.filter((item) => !popularValues.has(item.value));

  const items: ThemedSelectOption[] = [];
  if (opts?.includePlaceholder !== false) {
    items.push({ value: "", label: placeholder });
  }
  items.push(
    { kind: "header", id: "popular", label: popularHeader },
    ...popular.map((p) => ({ value: p.value, label: p.label }))
  );

  if (remaining.length > 0) {
    items.push({ kind: "separator", id: "all-divider", label: allHeader });
    items.push(...remaining);
  }

  return items;
}

export function buildStateSelectOptions(): ThemedSelectOption[] {
  const states = getStates();
  const popular = POPULAR_STATE_KEYS.filter((s) => states.includes(s)).map(
    (s) => ({
      value: s,
      label: getStateDisplayLabel(s),
    })
  );
  const all = states.map((s) => ({
    value: s,
    label: getStateDisplayLabel(s),
  }));
  return buildGroupedOptions(
    "Any state",
    "Popular states",
    "All states",
    popular,
    all
  );
}

export function buildCitySelectOptions(state?: string): ThemedSelectOption[] {
  const cities = state
    ? getAllCitiesForState(state)
    : getAllCitiesComplete();
  const popularOrder = getPopularCityOrder(state);
  const ordered = prioritizeStrings(popularOrder, cities);
  const popular = popularOrder
    .filter((c) => cities.includes(c))
    .map((c) => ({ value: c, label: c }));
  const all = ordered.map((c) => ({ value: c, label: c }));

  return buildGroupedOptions(
    "Any city",
    state ? `Popular in ${getStateDisplayLabel(state)}` : "Popular cities",
    state ? `All in ${getStateDisplayLabel(state)}` : "All cities",
    popular,
    all
  );
}

export function buildPropertyTypeSelectOptions(): ThemedSelectOption[] {
  const all = PROPERTY_TYPES.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  return buildGroupedOptions(
    "Any property type",
    "Popular",
    "All property types",
    POPULAR_PROPERTY_TYPES,
    all
  );
}

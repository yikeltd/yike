/**
 * Default location knowledge provider.
 *
 * Yike adapter — extract behind provider interface for multi-product.
 * This is the ONLY file in `yip/knowledge/*` allowed to import
 * `@/constants/nigeriaLocations`.
 * Country selection is metadata-driven via `@/lib/country/config` (NG live only).
 */
import {
  NIGERIAN_STATES,
  getAreasForCity,
  getCitiesForState,
  getStateForCity,
} from "@/constants/nigeriaLocations";
import { getCountryConfig, DEFAULT_COUNTRY_ISO } from "@/lib/country/config";
import type { KnowledgeOption } from "../shared/types";
import type { LocationKnowledge } from "./types";

export class DefaultLocationKnowledge implements LocationKnowledge {
  constructor(private readonly countryIso: string = DEFAULT_COUNTRY_ISO) {}

  private assertNigeriaProvider(): void {
    const country = getCountryConfig(this.countryIso);
    if (!country.live || country.locationProvider !== "nigeria") {
      throw new Error(
        `Location knowledge for ${country.iso} is not live — Nigeria only until launch.`,
      );
    }
  }

  listStates(): KnowledgeOption[] {
    this.assertNigeriaProvider();
    return NIGERIAN_STATES.map((s) => ({ value: s, label: s }));
  }

  listCitiesForState(state: string): KnowledgeOption[] {
    this.assertNigeriaProvider();
    return getCitiesForState(state).map((c) => ({ value: c, label: c }));
  }

  listAreasForCity(state: string, city: string): KnowledgeOption[] {
    this.assertNigeriaProvider();
    return getAreasForCity(state, city).map((a) => ({ value: a, label: a }));
  }

  getStateForCity(city: string): string | undefined {
    this.assertNigeriaProvider();
    return getStateForCity(city);
  }
}

export function createLocationKnowledge(): LocationKnowledge {
  return new DefaultLocationKnowledge(DEFAULT_COUNTRY_ISO);
}

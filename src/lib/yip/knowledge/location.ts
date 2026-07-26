/**
 * Default location knowledge provider.
 *
 * Yike adapter — extract behind provider interface for multi-product.
 * This is the ONLY file in `yip/knowledge/*` allowed to import
 * `@/constants/nigeriaLocations`.
 */
import {
  NIGERIAN_STATES,
  getAreasForCity,
  getCitiesForState,
  getStateForCity,
} from "@/constants/nigeriaLocations";
import type { KnowledgeOption } from "../shared/types";
import type { LocationKnowledge } from "./types";

export class DefaultLocationKnowledge implements LocationKnowledge {
  listStates(): KnowledgeOption[] {
    return NIGERIAN_STATES.map((s) => ({ value: s, label: s }));
  }

  listCitiesForState(state: string): KnowledgeOption[] {
    return getCitiesForState(state).map((c) => ({ value: c, label: c }));
  }

  listAreasForCity(state: string, city: string): KnowledgeOption[] {
    return getAreasForCity(state, city).map((a) => ({ value: a, label: a }));
  }

  getStateForCity(city: string): string | undefined {
    return getStateForCity(city);
  }
}

export function createLocationKnowledge(): LocationKnowledge {
  return new DefaultLocationKnowledge();
}

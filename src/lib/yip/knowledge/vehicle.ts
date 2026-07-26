/**
 * Default vehicle knowledge provider.
 *
 * Yike adapter — extract behind provider interface for multi-product.
 * This is the ONLY file in `yip/knowledge/*` allowed to import
 * `@/lib/marketplace/*`. A BamSignal/BayRight deployment of YIP would swap
 * this file for its own vehicle data source without touching the interface.
 */
import { VEHICLE_CATEGORIES, VEHICLE_SPEC_FIELDS } from "@/lib/marketplace/vehicle-specs";
import { VEHICLE_MAKES, isValidTypeForMake, typesForMake } from "@/lib/marketplace/vehicle-makes";
import type { KnowledgeOption } from "../shared/types";
import type { VehicleKnowledge } from "./types";

function specOptions(key: string): KnowledgeOption[] {
  const field = VEHICLE_SPEC_FIELDS.find((f) => f.key === key);
  return field?.options?.map((o) => ({ value: o.value, label: o.label })) ?? [];
}

export class DefaultVehicleKnowledge implements VehicleKnowledge {
  listCategories(): KnowledgeOption[] {
    return VEHICLE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }));
  }

  listMakes(): KnowledgeOption[] {
    return VEHICLE_MAKES.map((m) => ({ value: m, label: m }));
  }

  listModelsForMake(make: string): KnowledgeOption[] {
    return typesForMake(make).map((m) => ({ value: m, label: m }));
  }

  isValidModelForMake(make: string, model: string): boolean {
    return isValidTypeForMake(make, model);
  }

  listSpecOptions(specKey: string): KnowledgeOption[] {
    return specOptions(specKey);
  }
}

export function createVehicleKnowledge(): VehicleKnowledge {
  return new DefaultVehicleKnowledge();
}

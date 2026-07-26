/**
 * Default property knowledge provider.
 *
 * Yike adapter — extract behind provider interface for multi-product.
 * This is the ONLY file in `yip/knowledge/*` allowed to import `@/constants/*`
 * for property data.
 */
import { LISTING_TYPES, propertyTypesForListingType } from "@/constants/listingTypes";
import { PROPERTY_CATEGORY_GROUPS, getPropertyCategoryLabel } from "@/constants/propertyCategories";
import { NIGERIAN_AMENITIES } from "@/constants/amenities";
import type { KnowledgeOption } from "../shared/types";
import type { PropertyKnowledge } from "./types";

export class DefaultPropertyKnowledge implements PropertyKnowledge {
  listListingTypes(): KnowledgeOption[] {
    return LISTING_TYPES.map((t) => ({ value: t.value, label: t.label }));
  }

  listCategoryGroups(): KnowledgeOption[] {
    return PROPERTY_CATEGORY_GROUPS.map((g) => ({ value: g.id, label: g.label }));
  }

  listPropertyTypesForListingType(listingType: string): KnowledgeOption[] {
    return propertyTypesForListingType(listingType).map((t) => ({ value: t.value, label: t.label }));
  }

  listAmenities(): KnowledgeOption[] {
    return NIGERIAN_AMENITIES.map((a) => ({ value: a.id, label: a.label }));
  }

  getPropertyTypeLabel(value: string): string {
    return getPropertyCategoryLabel(value);
  }
}

export function createPropertyKnowledge(): PropertyKnowledge {
  return new DefaultPropertyKnowledge();
}

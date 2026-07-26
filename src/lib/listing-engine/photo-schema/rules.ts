import type { PhotoRules } from "../types";
import {
  PROPERTY_COMMERCIAL_PHOTO_SCHEMA,
  PROPERTY_LAND_PHOTO_SCHEMA,
  PROPERTY_RESIDENTIAL_PHOTO_SCHEMA,
  PROPERTY_SHORTLET_PHOTO_SCHEMA,
} from "./property";
import { VEHICLE_PHOTO_SCHEMA } from "./vehicle";

/** Shared by PROPERTY_CATEGORY_MANIFEST + legacy property form resolvers. */
export const PROPERTY_PHOTO_RULES: PhotoRules = {
  min: 2,
  max: 20,
  schema: PROPERTY_RESIDENTIAL_PHOTO_SCHEMA,
  schemaVariants: [
    { when: { op: "rule", id: "property.is_land" }, schema: PROPERTY_LAND_PHOTO_SCHEMA },
    {
      when: { op: "rule", id: "property.is_commercial" },
      schema: PROPERTY_COMMERCIAL_PHOTO_SCHEMA,
    },
    {
      when: { op: "equals", field: "listing_type", value: "shortlet" },
      schema: PROPERTY_SHORTLET_PHOTO_SCHEMA,
    },
  ],
  recommendedCover: "first",
};

export const VEHICLE_PHOTO_RULES: PhotoRules = {
  min: 1,
  max: 20,
  schema: VEHICLE_PHOTO_SCHEMA,
  recommendedCover: "first",
};

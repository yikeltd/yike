import type { PhotoRules } from "../types";
import {
  LISTING_CREATE_MAX_PHOTOS,
  LISTING_CREATE_MIN_PHOTOS,
} from "@/lib/listing-create/constants";
import {
  ELECTRONICS_GENERIC_PHOTO_SCHEMA,
  ELECTRONICS_LAPTOP_PHOTO_SCHEMA,
  ELECTRONICS_PHONE_PHOTO_SCHEMA,
  ELECTRONICS_TV_PHOTO_SCHEMA,
} from "./electronics";
import {
  PROPERTY_COMMERCIAL_PHOTO_SCHEMA,
  PROPERTY_LAND_PHOTO_SCHEMA,
  PROPERTY_RESIDENTIAL_PHOTO_SCHEMA,
  PROPERTY_SHORTLET_PHOTO_SCHEMA,
} from "./property";
import { MOTORCYCLE_PHOTO_SCHEMA } from "./motorcycle";
import { VEHICLE_PHOTO_SCHEMA } from "./vehicle";

/** Shared by PROPERTY_CATEGORY_MANIFEST + legacy property form resolvers. */
export const PROPERTY_PHOTO_RULES: PhotoRules = {
  min: LISTING_CREATE_MIN_PHOTOS,
  max: LISTING_CREATE_MAX_PHOTOS,
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
  min: LISTING_CREATE_MIN_PHOTOS,
  max: LISTING_CREATE_MAX_PHOTOS,
  schema: VEHICLE_PHOTO_SCHEMA,
  schemaVariants: [
    {
      when: {
        op: "equals",
        field: "auto_category",
        value: ["motorcycle", "motorcycle_tricycle"],
      },
      schema: MOTORCYCLE_PHOTO_SCHEMA,
    },
  ],
  recommendedCover: "first",
};

export const ELECTRONICS_PHOTO_RULES: PhotoRules = {
  min: LISTING_CREATE_MIN_PHOTOS,
  max: LISTING_CREATE_MAX_PHOTOS,
  schema: ELECTRONICS_GENERIC_PHOTO_SCHEMA,
  schemaVariants: [
    {
      when: { op: "equals", field: "auto_category", value: "phones_tablets" },
      schema: ELECTRONICS_PHONE_PHOTO_SCHEMA,
    },
    {
      when: {
        op: "equals",
        field: "auto_category",
        value: ["computers", "gaming"],
      },
      schema: ELECTRONICS_LAPTOP_PHOTO_SCHEMA,
    },
    {
      when: { op: "equals", field: "auto_category", value: "tv_audio" },
      schema: ELECTRONICS_TV_PHOTO_SCHEMA,
    },
  ],
  recommendedCover: "first",
};

import { buildPhotoSchema, tag } from "./helpers";

/** Motorcycles — no dashboard, odometer, boot or VIN-plate car labels. */
export const MOTORCYCLE_PHOTO_SCHEMA = buildPhotoSchema({
  id: "vehicle.motorcycle",
  tags: [
    tag("cover", "Cover Photo"),
    tag("exterior_front", "Front"),
    tag("exterior_rear", "Rear"),
    tag("left_side", "Left Side"),
    tag("right_side", "Right Side"),
    tag("odometer", "Odometer"),
    tag("engine", "Engine"),
    tag("tyres", "Tyres"),
    tag("damage", "Damage"),
    tag("accessories", "Helmet / extras"),
    tag("other", "Other"),
  ],
  uploadSequence: [
    "cover",
    "exterior_front",
    "exterior_rear",
    "left_side",
    "right_side",
    "engine",
    "tyres",
    "other",
  ],
  preferredCoverIds: ["cover", "exterior_front", "left_side"],
  poorCoverIds: ["other", "damage", "odometer"],
  recommendedShots: ["Front", "Rear", "Sides", "Engine", "Tyres"],
  uploadHint: "Start with front, rear, both sides, engine, and tyres.",
  labelPlaceholder: "Photo label…",
});

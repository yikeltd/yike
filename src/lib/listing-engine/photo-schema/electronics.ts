import { buildPhotoSchema, tag } from "./helpers";

const BASE_TAGS = [
  tag("cover", "Cover Photo"),
  tag("front", "Front"),
  tag("rear", "Rear"),
  tag("screen", "Screen / Display"),
  tag("ports", "Ports & connectors"),
  tag("accessories", "Accessories in box"),
  tag("packaging", "Packaging"),
  tag("damage", "Wear or damage"),
  tag("other", "Other"),
] as const;

/** Default electronics — no vehicle or property room labels. */
export const ELECTRONICS_GENERIC_PHOTO_SCHEMA = buildPhotoSchema({
  id: "electronics.generic",
  tags: [...BASE_TAGS],
  uploadSequence: [
    "cover",
    "front",
    "rear",
    "screen",
    "accessories",
    "other",
  ],
  preferredCoverIds: ["cover", "front", "screen"],
  poorCoverIds: ["other", "damage", "packaging"],
  recommendedShots: ["Front", "Rear", "Screen", "Accessories"],
  uploadHint: "Show front, rear, screen or main surface, and any accessories.",
  labelPlaceholder: "Photo label…",
});

export const ELECTRONICS_PHONE_PHOTO_SCHEMA = buildPhotoSchema({
  id: "electronics.phone",
  tags: [...BASE_TAGS],
  uploadSequence: ["cover", "front", "rear", "screen", "ports", "accessories", "other"],
  preferredCoverIds: ["cover", "front", "screen"],
  poorCoverIds: ["other", "damage", "packaging"],
  recommendedShots: ["Front", "Rear", "Screen condition", "Accessories"],
  uploadHint: "Include front, back, screen condition, and charger or box if included.",
  labelPlaceholder: "Photo label…",
});

export const ELECTRONICS_LAPTOP_PHOTO_SCHEMA = buildPhotoSchema({
  id: "electronics.laptop",
  tags: [
    tag("cover", "Cover Photo"),
    tag("screen", "Screen"),
    tag("keyboard", "Keyboard"),
    tag("ports", "Ports"),
    tag("body", "Body / hinges"),
    tag("accessories", "Accessories"),
    tag("damage", "Wear or damage"),
    tag("other", "Other"),
  ],
  uploadSequence: ["cover", "screen", "keyboard", "ports", "body", "accessories", "other"],
  preferredCoverIds: ["cover", "screen", "body"],
  poorCoverIds: ["other", "damage"],
  recommendedShots: ["Screen", "Keyboard", "Ports", "Body", "Accessories"],
  uploadHint: "Show screen, keyboard, ports, overall condition, and charger if included.",
  labelPlaceholder: "Photo label…",
});

export const ELECTRONICS_TV_PHOTO_SCHEMA = buildPhotoSchema({
  id: "electronics.tv",
  tags: [
    tag("cover", "Cover Photo"),
    tag("front", "Front / screen"),
    tag("rear", "Rear panel"),
    tag("ports", "Ports"),
    tag("remote", "Remote"),
    tag("accessories", "Accessories"),
    tag("damage", "Wear or damage"),
    tag("other", "Other"),
  ],
  uploadSequence: ["cover", "front", "rear", "ports", "remote", "other"],
  preferredCoverIds: ["cover", "front"],
  poorCoverIds: ["other", "damage"],
  recommendedShots: ["Screen", "Rear ports", "Remote", "Accessories"],
  uploadHint: "Show the screen, rear ports, remote, and stand or wall mount if included.",
  labelPlaceholder: "Photo label…",
});

/**
 * Category-aware photo taxonomy types.
 * UI renders schema only — never hardcodes vehicle/property tag lists.
 */

export type PhotoTag = {
  /** Stable machine id (extend without renaming stored labels when possible). */
  id: string;
  /** Value stored in media_items.room_label and shown in the dropdown. */
  label: string;
};

export type PhotoSchema = {
  id: string;
  version: number;
  tags: readonly PhotoTag[];
  /** Upload-order suggestions — tag ids in sequence. */
  uploadSequence: readonly string[];
  preferredCoverIds: readonly string[];
  poorCoverIds: readonly string[];
  /** Story / swipe order by tag id (lower = earlier). */
  storyOrder: Readonly<Record<string, number>>;
  /** Soft “Recommended shots” chips — not validation. */
  recommendedShots: readonly string[];
  /** Optional short upload hint for the photo manager. */
  uploadHint?: string;
  labelPlaceholder?: string;
};

export type PhotoSchemaVariant = {
  when: import("../types").VisibilityRule;
  schema: PhotoSchema;
};

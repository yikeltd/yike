import type { PhotoSchema, PhotoTag } from "./types";

export function tag(id: string, label: string): PhotoTag {
  return { id, label };
}

export function buildPhotoSchema(input: {
  id: string;
  version?: number;
  tags: readonly PhotoTag[];
  uploadSequence: readonly string[];
  preferredCoverIds: readonly string[];
  poorCoverIds?: readonly string[];
  recommendedShots: readonly string[];
  uploadHint?: string;
  labelPlaceholder?: string;
}): PhotoSchema {
  const storyOrder: Record<string, number> = {};
  input.tags.forEach((t, i) => {
    storyOrder[t.id] = t.id === "other" ? 99 : i;
  });

  const ids = new Set(input.tags.map((t) => t.id));
  for (const seqId of input.uploadSequence) {
    if (!ids.has(seqId)) {
      throw new Error(`photoSchema "${input.id}": uploadSequence id "${seqId}" missing from tags`);
    }
  }

  return {
    id: input.id,
    version: input.version ?? 1,
    tags: input.tags,
    uploadSequence: input.uploadSequence,
    preferredCoverIds: input.preferredCoverIds,
    poorCoverIds: input.poorCoverIds ?? ["other", "damage"],
    storyOrder,
    recommendedShots: input.recommendedShots,
    uploadHint: input.uploadHint,
    labelPlaceholder: input.labelPlaceholder ?? "Photo label…",
  };
}

export function schemaLabelById(schema: PhotoSchema, id: string): string | undefined {
  return schema.tags.find((t) => t.id === id)?.label;
}

export function schemaTagByLabel(
  schema: PhotoSchema,
  label: string | null | undefined
): PhotoTag | undefined {
  if (!label) return undefined;
  const normalized = label.trim().toLowerCase();
  return schema.tags.find((t) => t.label.toLowerCase() === normalized);
}

export function schemaLabels(schema: PhotoSchema): string[] {
  return schema.tags.map((t) => t.label);
}

export function suggestLabelFromSchema(schema: PhotoSchema, index: number): string {
  const seq = schema.uploadSequence;
  const id = seq[Math.min(index, seq.length - 1)] ?? "other";
  return schemaLabelById(schema, id) ?? "Other";
}

export function isValidPhotoLabel(
  schema: PhotoSchema,
  label: string | null | undefined
): boolean {
  if (!label || !label.trim()) return true; // empty allowed until confirm
  return Boolean(schemaTagByLabel(schema, label));
}

export function preferredCoverLabelSet(schema: PhotoSchema): Set<string> {
  return new Set(
    schema.preferredCoverIds
      .map((id) => schemaLabelById(schema, id))
      .filter((v): v is string => Boolean(v))
  );
}

export function poorCoverLabelSet(schema: PhotoSchema): Set<string> {
  return new Set(
    schema.poorCoverIds
      .map((id) => schemaLabelById(schema, id))
      .filter((v): v is string => Boolean(v))
  );
}

export function storyOrderForSchemaLabel(
  schema: PhotoSchema,
  label?: string | null
): number {
  const tag = schemaTagByLabel(schema, label);
  if (!tag) return 50;
  return schema.storyOrder[tag.id] ?? 50;
}

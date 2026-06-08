export function escapeIlike(q: string): string {
  return q.replace(/[%_]/g, "");
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value.trim());
}

export function buildIlikeOr(fields: string[], q: string): string {
  const pattern = `%${escapeIlike(q)}%`;
  return fields.map((field) => `${field}.ilike.${pattern}`).join(",");
}

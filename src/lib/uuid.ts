const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks if a string is a valid UUID (v1-v5).
 */
export function isValidUuid(val: unknown): boolean {
  if (!val || typeof val !== "string") return false;
  return UUID_REGEX.test(val.trim());
}

/**
 * Sanitizes input values before inserting or querying PostgreSQL UUID columns.
 * Returns valid UUID string or null if empty/invalid, preventing PostgreSQL error:
 * "invalid input syntax for type uuid: ''".
 */
export function toOptionalUuid(val: unknown): string | null {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "" || !UUID_REGEX.test(trimmed)) return null;
  return trimmed;
}

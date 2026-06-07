/** Calm safety copy for handoffs — never alarmist or overpromising. */
export const SAFETY_HANDOFF_LINE =
  "For your safety, please confirm property details and avoid making payments without proper verification.";

/** @deprecated use SAFETY_HANDOFF_LINE */
export const LEGACY_SAFETY_LINE =
  "For your safety, please avoid making payments without proper verification.";

export function withSafetyLine(body: string): string {
  const trimmed = body.trim();
  if (
    trimmed.includes(SAFETY_HANDOFF_LINE) ||
    trimmed.includes(LEGACY_SAFETY_LINE)
  ) {
    return trimmed.replace(LEGACY_SAFETY_LINE, SAFETY_HANDOFF_LINE);
  }
  return `${trimmed}\n\n${SAFETY_HANDOFF_LINE}`;
}

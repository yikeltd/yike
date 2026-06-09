const DAY_MS = 86_400_000;

export function offsetDaysIso(days: number, base = new Date()): string {
  return new Date(base.getTime() + days * DAY_MS).toISOString();
}

export function offsetMsIso(ms: number, base = new Date()): string {
  return new Date(base.getTime() + ms).toISOString();
}

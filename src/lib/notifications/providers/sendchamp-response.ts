/** Sendchamp API envelope — https://sendchamp.readme.io/reference/introduction */
export type SendchampEnvelope<T = Record<string, unknown>> = {
  status?: string;
  code?: number;
  message?: string;
  errors?: unknown;
  data?: T;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function isSendchampSuccess(
  body: Record<string, unknown>,
  httpOk: boolean
): boolean {
  if (!httpOk) return false;
  const status = String(body.status ?? "").toLowerCase();
  if (status === "success") return true;
  if (["failed", "error", "failure"].includes(status)) return false;
  return httpOk;
}

export function sendchampErrorMessage(body: Record<string, unknown>, httpStatus: number): string {
  const direct = pickString(body, "message", "error");
  if (direct) return direct;

  const errors = body.errors;
  if (typeof errors === "string" && errors.trim()) return errors.trim();
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const msg = pickString(first as Record<string, unknown>, "message", "error");
      if (msg) return msg;
    }
  }

  return `Sendchamp request failed (${httpStatus})`;
}

export function pickSendchampReference(body: Record<string, unknown>): string | undefined {
  const data = asRecord(body.data);
  if (!data) return undefined;
  const ref = pickString(data, "verification_reference", "reference", "sms_uid", "uid", "id");
  return ref || undefined;
}

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
  if (["failed", "error", "failure"].includes(status)) return false;
  if (status === "success" || status === "sent" || status === "queued") return true;

  const code = typeof body.code === "number" ? body.code : Number(body.code);
  if (Number.isFinite(code) && code >= 400) return false;
  if (code === 200 || code === 201) return true;

  const message = String(body.message ?? "").toLowerCase();
  if (message.includes("invalid") || message.includes("unauthorized")) return false;
  if (message.includes("success") || message.includes("sent")) return true;

  const data = body.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    const dataStatus = String(record.status ?? "").toLowerCase();
    if (["failed", "error", "failure"].includes(dataStatus)) return false;
    if (dataStatus === "success" || dataStatus === "sent" || dataStatus === "queued") {
      return true;
    }
    if (pickString(record, "verification_reference", "reference", "sms_uid", "uid", "id")) {
      return true;
    }
  }

  if (body.errors != null && body.errors !== "") {
    return false;
  }

  return false;
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

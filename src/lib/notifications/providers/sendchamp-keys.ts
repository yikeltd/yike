/** Detect Supabase JWTs mistakenly pasted into Sendchamp env vars. */
export function looksLikeSupabaseKey(key: string): boolean {
  const trimmed = key.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("sb_publishable_") || trimmed.startsWith("sb_secret_")) {
    return true;
  }
  if (!trimmed.startsWith("eyJ")) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(trimmed.split(".")[1] ?? "", "base64url").toString("utf8")
    ) as { iss?: string; role?: string };
    return (
      payload.iss === "supabase" ||
      payload.role === "service_role" ||
      payload.role === "anon"
    );
  } catch {
    return false;
  }
}

/** SMS sender IDs are max 11 chars; reject Supabase label copy-paste mistakes. */
export function resolveSmsSender(raw?: string): string {
  const trimmed = (raw ?? "").trim();
  const invalid =
    !trimmed ||
    trimmed.length > 11 ||
    /service.?role|supabase|secret|eyJhbG|sb_/i.test(trimmed);

  if (invalid) {
    if (trimmed) {
      console.warn(
        "[sendchamp] Invalid SENDCHAMP_SMS_SENDER — use approved ID like Yike:",
        trimmed.slice(0, 24)
      );
    }
    return "Yike";
  }
  return trimmed;
}

export function auditSendchampEnv(): string[] {
  const warnings: string[] = [];
  for (const name of ["SENDCHAMP_PUBLIC_KEY", "SENDCHAMP_API_KEY"] as const) {
    const value = process.env[name]?.trim();
    if (!value) continue;
    if (looksLikeSupabaseKey(value)) {
      warnings.push(
        `${name} looks like a Supabase key — use Sendchamp public access key from app.sendchamp.com`
      );
    }
  }

  const smsRaw = process.env.SENDCHAMP_SMS_SENDER?.trim();
  if (smsRaw && resolveSmsSender(smsRaw) !== smsRaw) {
    warnings.push(
      `SENDCHAMP_SMS_SENDER is invalid ("${smsRaw.slice(0, 20)}…") — must be approved sender like Yike`
    );
  }

  const wa = process.env.SENDCHAMP_WHATSAPP_SENDER?.trim();
  if (wa && !/^234\d{10}$/.test(wa.replace(/\D/g, "").replace(/^234/, "234"))) {
    const digits = wa.replace(/\D/g, "");
    if (!digits.startsWith("234") || digits.length !== 13) {
      warnings.push(
        "SENDCHAMP_WHATSAPP_SENDER must be a 234… phone number, not a brand name"
      );
    }
  }

  return warnings;
}

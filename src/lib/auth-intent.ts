export type AuthIntentType =
  | "whatsapp"
  | "call"
  | "save"
  | "profile"
  | "saved"
  | "list_property"
  | "review_agent"
  | "verification_request";

/** Future OAuth (Google / Apple) — extend provider wiring here; email OTP stays primary. */
export type AuthProviderId = "email" | "google" | "apple";

/** No sign-in required — required for Play Store / SEO browsing. */
export const AUTH_PUBLIC_INTENTS = new Set<AuthIntentType>(["whatsapp", "call"]);

/** Sign-in only — email verification not required. */
export const AUTH_LOGIN_ONLY_INTENTS = new Set<AuthIntentType>([
  "review_agent",
  "save",
  "verification_request",
]);

export interface AuthIntent {
  type: AuthIntentType;
  listingId?: string;
  agentId?: string;
  redirectPath?: string;
  /** WhatsApp / call payload */
  contactUrl?: string;
  sourceSurface?: string;
  metadata?: Record<string, string | number | boolean>;
}

const STORAGE_KEY = "yike_auth_intent";

export function saveAuthIntent(intent: AuthIntent): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    /* ignore */
  }
}

export function peekAuthIntent(): AuthIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthIntent;
  } catch {
    return null;
  }
}

export function clearAuthIntent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

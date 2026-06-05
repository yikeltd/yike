export type AuthIntentType =
  | "whatsapp"
  | "call"
  | "save"
  | "profile"
  | "saved"
  | "list_property";

export interface AuthIntent {
  type: AuthIntentType;
  listingId?: string;
  redirectPath?: string;
  /** WhatsApp / call payload */
  contactUrl?: string;
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

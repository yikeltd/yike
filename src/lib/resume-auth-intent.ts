import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  peekAuthIntent,
  clearAuthIntent,
  AUTH_LOGIN_ONLY_INTENTS,
} from "@/lib/auth-intent";
import { executeAuthIntent } from "@/lib/execute-auth-intent";

export const RESUME_VERIFICATION_KEY = "yike_resume_verification";

/** Pending intent takes priority over a plain `next` redirect. */
export async function resumePendingAuthIntent(
  router: AppRouterInstance,
  options?: {
    fallbackPath?: string;
    emailVerified?: boolean;
  }
): Promise<boolean> {
  const pending = peekAuthIntent();
  if (!pending) {
    if (options?.fallbackPath) {
      router.push(options.fallbackPath);
      router.refresh();
    }
    return false;
  }

  const needsVerify =
    !options?.emailVerified && !AUTH_LOGIN_ONLY_INTENTS.has(pending.type);
  if (needsVerify) return false;

  clearAuthIntent();
  if (pending.type === "verification_request" && pending.listingId) {
    try {
      sessionStorage.setItem(RESUME_VERIFICATION_KEY, pending.listingId);
    } catch {
      /* ignore */
    }
  }
  await executeAuthIntent(pending, router);
  router.refresh();
  return true;
}

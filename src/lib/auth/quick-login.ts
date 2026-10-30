export type QuickLoginUser = {
  userId: string;
  email: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

const STORAGE_KEY = "yike_quick_user";

let cachedRaw: string | null | undefined;
let cachedUser: QuickLoginUser | null = null;

function invalidateQuickLoginCache(): void {
  cachedRaw = undefined;
}

export function saveQuickLoginUser(user: QuickLoginUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    invalidateQuickLoginCache();
    window.dispatchEvent(new Event("yike-quick-user"));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getQuickLoginUser(): QuickLoginUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedUser;
    cachedRaw = raw;
    if (!raw) {
      cachedUser = null;
      return null;
    }
    const parsed = JSON.parse(raw) as QuickLoginUser;
    if (!parsed?.userId || !parsed?.email) {
      cachedUser = null;
      return null;
    }
    cachedUser = parsed;
    return cachedUser;
  } catch {
    invalidateQuickLoginCache();
    cachedUser = null;
    return null;
  }
}

export function clearQuickLoginUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    invalidateQuickLoginCache();
    window.dispatchEvent(new Event("yike-quick-user"));
  } catch {
    /* ignore */
  }
}

export function subscribeQuickLoginUser(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    invalidateQuickLoginCache();
    onStoreChange();
  };
  window.addEventListener("yike-quick-user", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("yike-quick-user", handler);
    window.removeEventListener("storage", handler);
  };
}

export function profileToQuickLogin(profile: {
  id: string;
  email?: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}): QuickLoginUser {
  return {
    userId: profile.id,
    email: profile.email ?? "",
    fullName: profile.full_name ?? null,
    username: profile.username ?? null,
    avatarUrl: profile.avatar_url ?? null,
  };
}

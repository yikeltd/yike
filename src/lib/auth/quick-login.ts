export type QuickLoginUser = {
  userId: string;
  email: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

const STORAGE_KEY = "yike_quick_user";

export function saveQuickLoginUser(user: QuickLoginUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getQuickLoginUser(): QuickLoginUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuickLoginUser;
    if (!parsed?.userId || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearQuickLoginUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
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

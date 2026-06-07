import { redirect } from "next/navigation";
import { getSession, getProfile } from "@/lib/auth";
import { getDefaultConsolePath, isStaffRole } from "@/lib/admin/roles";
import { STAFF_LOGIN_PATH } from "@/lib/admin-paths";
import type { UserRole } from "@/types/database";

export default async function LexCatchAll() {
  const user = await getSession();
  if (user) {
    const profile = await getProfile(user.id);
    if (profile && !profile.is_banned && isStaffRole(profile.role)) {
      redirect(getDefaultConsolePath(profile.role as UserRole));
    }
  }
  redirect(STAFF_LOGIN_PATH);
}

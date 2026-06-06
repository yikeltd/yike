import { redirect } from "next/navigation";
import { getSession, getProfile } from "@/lib/auth";
import { canAccessAuthConsole } from "@/lib/admin/roles";
import { ADMIN_OVERVIEW_PATH, STAFF_LOGIN_PATH } from "@/lib/admin-paths";

export default async function AuthLoginRedirect() {
  const user = await getSession();
  if (user) {
    const profile = await getProfile(user.id);
    if (profile && !profile.is_banned && canAccessAuthConsole(profile.role)) {
      redirect(ADMIN_OVERVIEW_PATH);
    }
  }
  redirect(STAFF_LOGIN_PATH);
}

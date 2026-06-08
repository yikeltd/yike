import { redirect } from "next/navigation";
import { getSession, getProfile } from "@/lib/auth";
import { isStaffRole } from "@/lib/admin/roles";
import { resolveStaffLandingRoom } from "@/lib/admin/staff-landing.server";
import { STAFF_LOGIN_PATH } from "@/lib/admin-paths";
import type { UserRole } from "@/types/database";

export const dynamic = "force-dynamic";

/** Staff APK / TWA entry — routes signed-in staff to their workspace. */
export default async function StaffAppEntryPage() {
  const user = await getSession();
  if (!user) {
    redirect(`${STAFF_LOGIN_PATH}?app=staff`);
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !isStaffRole(profile.role as UserRole)) {
    redirect(`${STAFF_LOGIN_PATH}?app=staff&denied=1`);
  }

  const landing = await resolveStaffLandingRoom(user.id, profile.role as UserRole);
  redirect(landing.path);
}

import { NextResponse } from "next/server";
import { getSession, getProfile } from "@/lib/auth";
import { isStaffRole } from "@/lib/admin/roles";
import {
  loadStaffPermissionContext,
} from "@/lib/admin/staff-permissions.server";
import {
  resolveStaffPermissions,
} from "@/lib/admin/staff-permissions";
import { getStaffLandingRoom } from "@/lib/admin/staff-landing-sync";
import type { UserRole } from "@/types/database";

export const runtime = "nodejs";

/** Resolve staff landing room for APK routing after login. */
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!profile || profile.is_banned || !isStaffRole(profile.role as UserRole)) {
    return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  }

  const role = profile.role as UserRole;
  const ctx = await loadStaffPermissionContext(user.id, role);
  const permissions = resolveStaffPermissions(ctx);
  const landing = getStaffLandingRoom({ role, permissions });

  return NextResponse.json({
    landing,
    permissions,
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
    },
  });
}

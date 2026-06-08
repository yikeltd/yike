import { createAdminClient } from "@/lib/supabase/admin";
import { canManageDealMatching } from "@/lib/deal-matching/permissions";
import type { UserRole } from "@/types/database";
import type { StaffPermissionContext } from "@/lib/admin/staff-permissions";
import { STAFF_WORK_AREAS, type StaffWorkArea } from "@/lib/admin/staff-work-areas";

export async function loadStaffPermissionContext(
  userId: string,
  role: UserRole
): Promise<StaffPermissionContext> {
  const admin = createAdminClient();
  let staffProfile: StaffPermissionContext["staffProfile"] = null;
  let assignedAreas: StaffWorkArea[] = [];
  let verificationControl = false;
  let enforceTrust = false;

  if (admin) {
    const [{ data: staffRow }, { data: assignments }, { data: verificationRow }] =
      await Promise.all([
        admin
          .from("staff_profiles")
          .select("id, role, department, responsibilities, status")
          .eq("id", userId)
          .maybeSingle(),
        admin
          .from("staff_work_assignments")
          .select("work_area, priority, is_active")
          .eq("staff_id", userId)
          .eq("is_active", true)
          .order("priority", { ascending: false }),
        admin
          .from("verification_control_permissions")
          .select("can_manage_verification_control, can_enforce_trust, is_active")
          .eq("staff_id", userId)
          .maybeSingle(),
      ]);

    staffProfile = staffRow ?? null;
    assignedAreas = (assignments ?? [])
      .map((row) => row.work_area as StaffWorkArea)
      .filter((area) => (STAFF_WORK_AREAS as readonly string[]).includes(area));

    if (verificationRow?.is_active !== false) {
      verificationControl = Boolean(verificationRow?.can_manage_verification_control);
      enforceTrust = Boolean(verificationRow?.can_enforce_trust);
    }
  }

  const dealMatching = await canManageDealMatching(userId, role);

  return {
    profileRole: role,
    staffProfile,
    assignedAreas,
    dealMatching,
    verificationControl,
    enforceTrust,
  };
}

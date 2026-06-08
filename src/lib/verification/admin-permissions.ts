import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

export type VerificationControlPermissionRow = {
  staff_id: string;
  can_manage_verification_control: boolean;
  can_enforce_trust: boolean;
  assigned_by: string | null;
  assigned_at: string;
  assignment_notes: string | null;
  is_active: boolean;
};

export function roleHasVerificationControlAccess(role: UserRole): boolean {
  return isSuperAdmin(role);
}

export async function fetchVerificationControlPermission(
  staffId: string
): Promise<VerificationControlPermissionRow | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("verification_control_permissions")
    .select("*")
    .eq("staff_id", staffId)
    .maybeSingle();

  return (data as VerificationControlPermissionRow | null) ?? null;
}

export async function canManageVerificationControl(
  staffId: string,
  role: UserRole
): Promise<boolean> {
  if (roleHasVerificationControlAccess(role)) return true;
  if (role !== "support" && role !== "moderator") return false;

  const row = await fetchVerificationControlPermission(staffId);
  return Boolean(row?.is_active && row.can_manage_verification_control);
}

export async function canEnforceTrust(
  staffId: string,
  role: UserRole
): Promise<boolean> {
  if (isSuperAdmin(role) || role === "moderator") return true;
  if (role !== "support") return false;

  const row = await fetchVerificationControlPermission(staffId);
  return Boolean(row?.is_active && row.can_enforce_trust);
}

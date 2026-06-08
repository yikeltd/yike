import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdmin } from "@/lib/admin/roles";
import type { UserRole } from "@/types/database";

export type DealMatchingPermissionRow = {
  staff_id: string;
  can_manage_deal_matching: boolean;
  assigned_by: string | null;
  assigned_at: string;
  assignment_notes: string | null;
  is_active: boolean;
};

export function roleHasDealMatchingAccess(role: UserRole): boolean {
  return isSuperAdmin(role);
}

export async function fetchDealMatchingPermission(
  staffId: string
): Promise<DealMatchingPermissionRow | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("deal_matching_permissions")
    .select("*")
    .eq("staff_id", staffId)
    .maybeSingle();

  return (data as DealMatchingPermissionRow | null) ?? null;
}

export async function canManageDealMatching(
  staffId: string,
  role: UserRole
): Promise<boolean> {
  if (roleHasDealMatchingAccess(role)) return true;
  if (role !== "support") return false;

  const row = await fetchDealMatchingPermission(staffId);
  return Boolean(row?.is_active && row.can_manage_deal_matching);
}

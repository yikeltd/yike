import { redirect } from "next/navigation";
import { getSession, getProfile } from "@/lib/auth";
import { isStaffRole, getDefaultConsolePath } from "@/lib/admin/roles";
import { StaffLoginForm } from "@/components/admin/staff-login-form";
import type { UserRole } from "@/types/database";

export const metadata = {
  title: "Staff Login",
  robots: { index: false, follow: false },
};

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string; denied?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const staffApp = params.app === "staff";

  const user = await getSession();
  if (user) {
    const profile = await getProfile(user.id);
    if (profile && !profile.is_banned && isStaffRole(profile.role)) {
      redirect(getDefaultConsolePath(profile.role));
    }
  }

  return <StaffLoginForm staffApp={staffApp} />;
}

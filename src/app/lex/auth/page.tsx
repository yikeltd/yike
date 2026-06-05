import { redirect } from "next/navigation";
import { getSession, getProfile, isAdmin } from "@/lib/auth";
import { ADMIN_OVERVIEW_PATH } from "@/lib/admin-paths";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getSession();
  if (user) {
    const profile = await getProfile(user.id);
    if (profile && !profile.is_banned && isAdmin(profile.role)) {
      redirect(ADMIN_OVERVIEW_PATH);
    }
  }

  return <AdminLoginForm />;
}

import { StaffLoginForm } from "@/components/admin/staff-login-form";

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

  return <StaffLoginForm staffApp={staffApp} />;
}

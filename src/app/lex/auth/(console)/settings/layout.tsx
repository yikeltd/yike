import { requireSuperAdmin } from "@/lib/auth";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();
  return children;
}

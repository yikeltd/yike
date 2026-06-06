import { requireSuperAdmin } from "@/lib/auth";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();
  return children;
}

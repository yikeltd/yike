import { requireSuperAdmin } from "@/lib/auth";

export default async function AuditLogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();
  return children;
}

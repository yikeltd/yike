/** Admin / internal routes — no consumer chrome */
import { StaffSessionGuard } from "@/components/admin/shell/staff-session-guard";

export default function LexLayout({ children }: { children: React.ReactNode }) {
  return <StaffSessionGuard>{children}</StaffSessionGuard>;
}

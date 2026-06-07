import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { supportPath } from "@/lib/admin-paths";
import { QuickRepliesPanel } from "@/components/support/quick-replies-panel";

export default function SupportQuickRepliesPage() {
  return (
    <div className="space-y-6">
      <Link
        href={supportPath("leads")}
        className="text-sm font-semibold text-gold-dark"
      >
        ← Back to leads
      </Link>
      <AdminPageHeader
        title="Quick replies"
        description="Copy, edit, and search support handoff messages"
      />
      <QuickRepliesPanel />
    </div>
  );
}

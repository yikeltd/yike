import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";

export default function TechUploadsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Failed uploads" description="Media pipeline issues" />
      <p className="rounded-2xl border border-navy/10 bg-white p-8 text-sm text-muted">
        No failed uploads flagged. Listing media uses the optimization pipeline in{" "}
        <code className="text-xs">src/lib/media/</code>.
      </p>
    </div>
  );
}

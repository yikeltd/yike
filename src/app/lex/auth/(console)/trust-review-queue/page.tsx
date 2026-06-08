import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminTrustReviewQueueBoard } from "@/components/admin/admin-trust-review-queue-board";

export default function TrustReviewQueuePage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Trust Review Queue"
        description="Human-guided trust decisions — escalate to verification, reduce restrictions, or resolve without public fraud labels"
      />
      <AdminTrustReviewQueueBoard />
    </div>
  );
}

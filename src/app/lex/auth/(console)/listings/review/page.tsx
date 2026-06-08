import { AdminBulkReviewBoard } from "@/components/admin/admin-bulk-review-board";
import Link from "next/link";

export default function BulkListingReviewPage() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy lg:text-2xl">Bulk listing review</h1>
          <p className="text-sm text-muted">
            Smart groups, scores, and one-click actions — triage fast without blind inspection.
          </p>
        </div>
        <Link
          href="/lex/auth/listings?status=pending"
          className="text-sm font-bold text-gold-dark hover:underline"
        >
          ← Classic queue
        </Link>
      </div>
      <AdminBulkReviewBoard />
    </div>
  );
}

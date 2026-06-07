import type { ListingHistoryEventType } from "./constants";

const ADMIN_LABELS: Record<ListingHistoryEventType, string> = {
  listing_created: "Listing created",
  listing_published: "Listing published",
  price_changed: "Price changed",
  status_changed: "Status changed",
  marked_rented: "Marked rented",
  marked_sold: "Marked sold",
  marked_unavailable: "Marked unavailable",
  reactivated: "Reactivated",
  expired: "Listing expired",
  verified_physical: "Physical verification completed",
  legal_review_requested: "Legal review requested",
  legal_review_completed: "Legal review completed",
  photos_updated: "Photos updated",
  description_updated: "Description updated",
  agent_changed: "Agent reassigned",
  company_changed: "Company changed",
  listing_boosted: "Listing boosted",
  report_received: "Report received",
  admin_reviewed: "Admin review",
};

export function listingHistoryEventLabel(type: string): string {
  return ADMIN_LABELS[type as ListingHistoryEventType] ?? type.replace(/_/g, " ");
}

export function formatHistoryEventDetail(
  type: string,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null
): string | null {
  if (type === "price_changed" && oldValue?.price != null && newValue?.price != null) {
    return `₦${Number(oldValue.price).toLocaleString()} → ₦${Number(newValue.price).toLocaleString()}`;
  }
  if (type === "status_changed" && oldValue?.status && newValue?.status) {
    return `${String(oldValue.status)} → ${String(newValue.status)}`;
  }
  if (type === "photos_updated" && newValue?.count != null) {
    return `${String(newValue.count)} photos`;
  }
  if (type === "agent_changed" && newValue?.agent_id) {
    return "Agent reassigned";
  }
  return null;
}

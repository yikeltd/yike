export function publicVerificationStatus(status: string | null | undefined): string {
  switch (status) {
    case "submitted":
    case "pending":
    case "contacted":
      return "Pending";
    case "under_review":
    case "awaiting_assignment":
    case "fraud_review":
      return "In review";
    case "assigned":
      return "Assigned";
    case "accepted":
    case "in_progress":
      return "Inspection ongoing";
    case "completed":
    case "reviewed":
    case "delivered":
    case "closed":
      return "Completed";
    case "rejected":
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export function timelineLabel(value: string | null | undefined): string {
  switch (value) {
    case "this_week":
      return "This week";
    case "48_hours":
      return "Within 48 hours";
    case "24_hours":
      return "Within 24 hours";
    case "same_day":
      return "Same day if possible";
    default:
      return "Flexible";
  }
}

export function priorityLabel(value: string | null | undefined): string {
  switch (value) {
    case "urgent":
      return "Urgent";
    case "high":
      return "High";
    case "low":
      return "Flexible";
    default:
      return "Normal";
  }
}

const CHECK_LABELS: Record<string, string> = {
  property_exists: "Property exists",
  property_available: "Property is available",
  pictures_match: "Pictures match",
  area_neighbourhood: "Area/neighbourhood",
  road_access: "Road access",
  occupancy_condition: "Occupancy condition",
  agent_presence: "Agent presence",
  other_observations: "Other observations",
  land_location: "Land location",
  encroachment_signs: "Occupancy/encroachment signs",
  local_observations: "Local observations",
  confirm_exists: "Property exists",
  confirm_availability: "Property is available",
  confirm_photos: "Pictures match",
  confirm_neighborhood: "Area/neighbourhood",
  confirm_road_access: "Road access",
  confirm_occupancy: "Occupancy condition",
  ask_locally: "Local observations",
  verify_agent: "Agent presence",
  additional_observations: "Other observations",
};

const SITUATION_LABELS: Record<string, string> = {
  outside_property_city: "Outside property city",
  outsideCity: "Outside property city",
  outside_nigeria: "Outside Nigeria",
  already_paid: "Already sent money",
  alreadyPaid: "Already sent money",
  scam_worry: "Worried about scam",
  cannot_inspect: "Cannot inspect physically",
  urgent_relocation: "Urgent relocation",
  fake_picture_concern: "Fake picture concern",
  fake_pictures: "Fake picture concern",
  land_concern: "Land concern",
  land_ownership: "Land concern",
};

function labelsFromRecord(
  value: unknown,
  labels: Record<string, string>
): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, active]) => Boolean(active))
    .map(([key]) => labels[key] ?? key.replaceAll("_", " "))
    .filter(Boolean);
}

export function checkLabels(value: unknown): string[] {
  return labelsFromRecord(value, CHECK_LABELS);
}

export function situationLabels(value: unknown): string[] {
  return labelsFromRecord(value, SITUATION_LABELS);
}

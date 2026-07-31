export type PartnerDiscipline =
  | "property_inspector"
  | "vehicle_inspector"
  | "legal_partner"
  | "land_surveyor"
  | "valuer"
  | "logistics";

export type ComplianceTier =
  | "TIER_1_VERIFIED"
  | "TIER_2_ENTERPRISE"
  | "TIER_3_GOVT_CERTIFIED";

export type PartnerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  discipline: PartnerDiscipline;
  licenseNumber: string;
  regulatoryBody: string;
  complianceTier: ComplianceTier;
  rating: number;
  totalDispatches: number;
  onTimeSlaPercent: number;
  activeJobs: number;
  geoFenceRegion: string;
  insuranceValidUntil: string;
  taxIdNumber: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  status: "active" | "suspended" | "pending_review";
};

export type DispatchJob = {
  dispatchId: string;
  passportId: string;
  partnerId: string;
  partnerName: string;
  discipline: PartnerDiscipline;
  region: string;
  status: "dispatched" | "accepted" | "in_progress" | "completed" | "sla_breached";
  dispatchedAt: string;
  slaMinutes: number;
};

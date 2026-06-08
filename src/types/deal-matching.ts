import type {
  CommissionStatus,
  DealMatchStatus,
  DealRequestSource,
  DealRequestType,
  OutreachRecipientType,
  OutreachStatus,
  PaymentStatus,
} from "@/lib/deal-matching/constants";

export type DealMatchRequest = {
  id: string;
  subject: string;
  request_type: DealRequestType;
  request_source: DealRequestSource;
  target_area: string | null;
  city: string | null;
  state: string | null;
  property_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  requirements: string | null;
  internal_notes: string | null;
  urgency: string;
  visibility: string;
  status: DealMatchStatus;
  expected_transaction_value: number | null;
  estimated_commission: number | null;
  agreed_percentage: number | null;
  commission_status: CommissionStatus;
  payment_status: PaymentStatus;
  negotiation_notes: string | null;
  created_by: string;
  assigned_support_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DealMatchOutreach = {
  id: string;
  request_id: string;
  recipient_user_id: string;
  recipient_type: OutreachRecipientType;
  status: OutreachStatus;
  notification_campaign_id: string | null;
  sent_at: string | null;
  responded_at: string | null;
  excluded_reason: string | null;
  created_by: string;
  created_at: string;
};

export type DealMatchingPermission = {
  staff_id: string;
  can_manage_deal_matching: boolean;
  assigned_by: string | null;
  assigned_at: string;
  assignment_notes: string | null;
  is_active: boolean;
  updated_at: string;
};

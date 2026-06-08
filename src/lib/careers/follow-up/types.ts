import type { RoleCategory } from "@/lib/careers/constants";

export type FollowUpQuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "salary"
  | "availability_date"
  | "years_experience"
  | "portfolio"
  | "yes_no"
  | "rating";

export type FollowUpQuestion = {
  id: string;
  label: string;
  type: FollowUpQuestionType;
  section?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export type FollowUpRecommendation =
  | "strong_fit"
  | "possible_fit"
  | "needs_interview"
  | "not_suitable"
  | "too_expensive"
  | "unclear";

export type FollowUpResponseScore = {
  communicationClarity: number;
  roleFit: number;
  experienceRelevance: number;
  salaryFit: number;
  availabilityFit: number;
  reliabilitySignals: number;
  pressureHandling: number;
  portfolioQuality: number;
  overall: number;
};

export type CareerFollowUpRow = {
  id: string;
  application_id: string;
  job_id: string;
  token_hash: string;
  questions: FollowUpQuestion[];
  answers: Record<string, string> | null;
  response_score: FollowUpResponseScore | null;
  recommendation: FollowUpRecommendation | null;
  red_flags: string[];
  strengths: string[];
  status: "draft" | "sent" | "opened" | "submitted" | "expired" | "cancelled";
  admin_notes: string | null;
  interview_notes: string | null;
  interview_scheduled_at: string | null;
  interview_link: string | null;
  sent_by: string | null;
  sent_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export const FOLLOW_UP_RECOMMENDATION_LABELS: Record<FollowUpRecommendation, string> = {
  strong_fit: "Strong fit",
  possible_fit: "Possible fit",
  needs_interview: "Needs interview",
  not_suitable: "Not suitable",
  too_expensive: "Too expensive",
  unclear: "Unclear",
};

export const FOLLOW_UP_EXPIRY_DAYS = 7;

export type FollowUpGenerationInput = {
  jobTitle: string;
  jobCategory: RoleCategory;
  department: string;
  requirements: string;
  application: {
    full_name: string;
    why_apply: string;
    years_experience: number;
    current_occupation: string;
    extra_answers: Record<string, string>;
    portfolio: string | null;
    linkedin: string | null;
  };
};

import type { OnboardingRoleKey } from "./constants";

export type StaffOnboardingPayload = {
  application_id: string;
  onboarding_role: OnboardingRoleKey;
  department: string;
  supervisor_id?: string | null;
  work_email: string;
  zoho_temp_password: string;
  yike_login_email: string;
  yike_temp_password: string;
  yike_login_url: string;
  zoho_login_url: string;
  welcome_note: string;
  instructions: string;
  responsibilities?: string[];
};

export type StaffOnboardingPreviewInput = Omit<
  StaffOnboardingPayload,
  "application_id" | "yike_temp_password" | "zoho_temp_password"
> & {
  full_name: string;
  job_title?: string;
  yike_temp_password: string;
  zoho_temp_password: string;
};

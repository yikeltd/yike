export const JOB_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
] as const;

export const ROLE_CATEGORIES = [
  { value: "marketing", label: "Marketing" },
  { value: "office", label: "Office & admin" },
  { value: "support", label: "Customer support" },
  { value: "field", label: "Field agents" },
  { value: "operations", label: "Operations" },
  { value: "content", label: "Content creation" },
  { value: "photography", label: "Photography" },
  { value: "growth", label: "Growth" },
  { value: "tech", label: "Technology" },
] as const;

export const AGE_RANGES = [
  "18–24",
  "25–34",
  "35–44",
  "45–54",
  "55+",
] as const;

export const EDUCATION_LEVELS = [
  "Secondary school",
  "OND / NCE",
  "HND",
  "Bachelor's degree",
  "Master's degree",
  "PhD / Professional",
  "Other",
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry (0–2 years)" },
  { value: "mid", label: "Mid (2–5 years)" },
  { value: "senior", label: "Senior (5+ years)" },
] as const;

export type JobType = (typeof JOB_TYPES)[number]["value"];
export type RoleCategory = (typeof ROLE_CATEGORIES)[number]["value"];
export type ApplicationStatus =
  | "submitted"
  | "shortlisted"
  | "review"
  | "low_priority"
  | "rejected"
  | "approved"
  | "interview"
  | "archived";

export type RoleQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export type ScoringCriteria = {
  keywords: string[];
  minExperience: number;
  preferredLocations: string[];
  skillsWeight: number;
  socialWeight: number;
  communicationMinWords: number;
};

export type JobRow = {
  id: string;
  slug: string;
  title: string;
  department: string;
  category: RoleCategory;
  location: string;
  job_type: JobType;
  salary_min: number | null;
  salary_max: number | null;
  short_description: string;
  requirements: string;
  role_questions: RoleQuestion[];
  scoring_criteria: ScoringCriteria;
  required_skills: string[];
  experience_level: string;
  status: "draft" | "published" | "closed" | "archived";
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ApplicationRow = {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  address: string | null;
  city: string;
  state: string;
  age_range: string;
  education_level: string;
  current_occupation: string;
  why_apply: string;
  years_experience: number;
  cv_url: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  stack_experience: string | null;
  extra_answers: Record<string, string>;
  score: number;
  score_breakdown: Record<string, number>;
  status: ApplicationStatus;
  source: string;
  created_at: string;
  updated_at: string;
  viewed_at: string | null;
  jobs?: Pick<JobRow, "title" | "slug" | "category" | "department">;
};

export function jobTypeLabel(type: JobType): string {
  return JOB_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function categoryLabel(cat: RoleCategory): string {
  return ROLE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function statusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    submitted: "New",
    shortlisted: "Shortlisted",
    review: "Review needed",
    low_priority: "Low score",
    rejected: "Rejected",
    approved: "Approved",
    interview: "Interview",
    archived: "Archived",
  };
  return map[status] ?? status;
}

export function scoreBucket(score: number): ApplicationStatus {
  if (score >= 70) return "shortlisted";
  if (score >= 60) return "review";
  return "low_priority";
}

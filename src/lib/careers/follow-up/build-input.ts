import type { ApplicationRow } from "@/lib/careers/constants";
import type { RoleCategory } from "@/lib/careers/constants";
import type { FollowUpGenerationInput } from "./types";

export function applicationToFollowUpInput(app: ApplicationRow): FollowUpGenerationInput {
  const job = app.jobs;
  return {
    jobTitle: job?.title ?? "Role",
    jobCategory: (job?.category ?? "content") as RoleCategory,
    department: job?.department ?? "",
    requirements: "",
    application: {
      full_name: app.full_name,
      why_apply: app.why_apply ?? "",
      years_experience: app.years_experience ?? 0,
      current_occupation: app.current_occupation ?? "",
      extra_answers: app.extra_answers ?? {},
      portfolio: app.portfolio,
      linkedin: app.linkedin,
    },
  };
}

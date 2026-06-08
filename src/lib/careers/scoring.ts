import type { ApplicationRow, JobRow, ScoringCriteria } from "./constants";
import { scoreBucket } from "./constants";

export type ApplicationPayload = Pick<
  ApplicationRow,
  | "full_name"
  | "email"
  | "whatsapp"
  | "address"
  | "city"
  | "state"
  | "age_range"
  | "education_level"
  | "current_occupation"
  | "why_apply"
  | "years_experience"
  | "cv_url"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "github"
  | "linkedin"
  | "portfolio"
  | "stack_experience"
  | "extra_answers"
>;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function keywordHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k.toLowerCase())).length;
}

function communicationScore(whyApply: string, extras: Record<string, string>, minWords: number): number {
  const combined = [whyApply, ...Object.values(extras)].join(" ");
  const words = wordCount(combined);
  if (words < 10) return 20;
  if (words < minWords) return 45;
  if (words < minWords * 2) return 70;
  const hasStructure = /because|experience|yike|team|role|skills/i.test(combined);
  return hasStructure ? 90 : 75;
}

function socialScore(app: ApplicationPayload, isTech: boolean): number {
  const links = [
    app.facebook,
    app.instagram,
    app.tiktok,
    app.linkedin,
    isTech ? app.github : null,
    isTech ? app.portfolio : null,
  ].filter((v) => v && v.trim().length > 3);
  if (links.length === 0) return 30;
  if (links.length === 1) return 55;
  if (links.length === 2) return 75;
  return 92;
}

function completenessScore(app: ApplicationPayload, requiredQuestionIds: string[]): number {
  const baseFields = [
    app.full_name,
    app.email,
    app.whatsapp,
    app.city,
    app.state,
    app.why_apply,
    app.current_occupation,
  ];
  const filledBase = baseFields.filter((f) => f && String(f).trim().length > 1).length;
  const basePct = (filledBase / baseFields.length) * 100;

  const answeredExtras = requiredQuestionIds.filter((id) => {
    const v = app.extra_answers?.[id];
    return v && String(v).trim().length > 2;
  });
  const extraPct =
    requiredQuestionIds.length === 0
      ? 100
      : (answeredExtras.length / requiredQuestionIds.length) * 100;

  const bonus = app.cv_url ? 8 : 0;
  return Math.min(100, Math.round(basePct * 0.6 + extraPct * 0.4 + bonus));
}

export function scoreApplication(
  app: ApplicationPayload,
  job: Pick<JobRow, "category" | "requirements" | "scoring_criteria" | "required_skills" | "role_questions">
): { score: number; breakdown: Record<string, number>; status: ReturnType<typeof scoreBucket> } {
  const criteria = (job.scoring_criteria ?? {}) as ScoringCriteria;
  const keywords = criteria.keywords ?? [];
  const isTech = job.category === "tech";

  const requiredIds = (job.role_questions ?? [])
    .filter((q) => q.required)
    .map((q) => q.id);

  const textBlob = [
    app.why_apply,
    app.current_occupation,
    app.stack_experience ?? "",
    JSON.stringify(app.extra_answers ?? {}),
    job.requirements,
  ].join(" ");

  const completeness = completenessScore(app, requiredIds);
  const communication = communicationScore(
    app.why_apply,
    app.extra_answers ?? {},
    criteria.communicationMinWords ?? 25
  );
  const roleRelevance = Math.min(
    100,
    Math.round(
      (keywordHits(textBlob, keywords) / Math.max(keywords.length, 1)) * 100 +
        keywordHits(textBlob, job.required_skills ?? []) * 8
    )
  );
  const socialPresence = socialScore(app, isTech);
  const experience =
    app.years_experience >= (criteria.minExperience ?? 0)
      ? Math.min(100, 60 + app.years_experience * 8)
      : Math.max(20, 40 + app.years_experience * 10);

  const locationText = `${app.city} ${app.state}`.toLowerCase();
  const preferred = criteria.preferredLocations ?? [];
  const location =
    preferred.length === 0 ||
    preferred.some((loc) => locationText.includes(loc) || loc.includes("nigeria") || loc.includes("remote"))
      ? 85
      : 50;

  const professionalism = app.cv_url ? 88 : app.education_level ? 72 : 60;

  const weights = {
    completeness: 0.18,
    communication: 0.22,
    roleRelevance: 0.2,
    socialPresence: criteria.socialWeight ?? 0.1,
    experience: 0.15,
    location: 0.05,
    professionalism: 0.1,
  };

  const breakdown = {
    completeness,
    communication,
    roleRelevance,
    socialPresence,
    experience,
    location,
    professionalism,
  };

  const score = Math.round(
    completeness * weights.completeness +
      communication * weights.communication +
      roleRelevance * weights.roleRelevance +
      socialPresence * weights.socialPresence +
      experience * weights.experience +
      location * weights.location +
      professionalism * weights.professionalism
  );

  const clamped = Math.max(0, Math.min(100, score));
  return {
    score: clamped,
    breakdown,
    status: scoreBucket(clamped),
  };
}

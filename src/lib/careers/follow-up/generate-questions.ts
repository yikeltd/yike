import type { RoleCategory } from "@/lib/careers/constants";
import type {
  FollowUpGenerationInput,
  FollowUpQuestion,
  FollowUpRecommendation,
  FollowUpResponseScore,
} from "./types";

function q(
  id: string,
  label: string,
  type: FollowUpQuestion["type"],
  section: string,
  extra?: Partial<FollowUpQuestion>
): FollowUpQuestion {
  return { id, label, type, section, required: true, ...extra };
}

const CORE_QUESTIONS: FollowUpQuestion[] = [
  q(
    "role_interest",
    "What interests you most about this role at Yike?",
    "long_text",
    "Role understanding"
  ),
  q(
    "audience_understanding",
    "How would you describe Yike's audience based on what you have seen?",
    "long_text",
    "Role understanding"
  ),
  q(
    "relevant_experience",
    "Tell us about your most relevant experience for this role.",
    "long_text",
    "Experience"
  ),
  q(
    "work_samples",
    "Share links to 2–3 examples of your strongest work.",
    "portfolio",
    "Experience",
    { placeholder: "Paste links — one per line" }
  ),
  q(
    "first_30_days",
    "How would you approach the first 30 days in this role?",
    "long_text",
    "Practical ability"
  ),
  q(
    "limited_direction",
    "Describe a project where you had to work quickly with limited direction.",
    "long_text",
    "Practical ability"
  ),
  q(
    "changing_priorities",
    "How do you handle urgent tasks or changing priorities?",
    "long_text",
    "Pressure and execution"
  ),
  q(
    "under_pressure",
    "Tell us about a time you worked under pressure.",
    "long_text",
    "Pressure and execution"
  ),
  q(
    "salary_expectation",
    "What is your expected monthly compensation or project rate?",
    "salary",
    "Salary and availability"
  ),
  q(
    "work_arrangement",
    "Are you open to contract, part-time, or flexible work?",
    "multiple_choice",
    "Salary and availability",
    {
      options: [
        "Yes — contract",
        "Yes — part-time",
        "Yes — flexible / remote",
        "Full-time only",
        "Depends on the offer",
      ],
    }
  ),
  q(
    "start_date",
    "When can you start?",
    "availability_date",
    "Salary and availability",
    { placeholder: "e.g. Immediately, 2 weeks, 1 March 2026" }
  ),
  q(
    "working_style",
    "What is your preferred working style?",
    "long_text",
    "Communication"
  ),
  q(
    "response_speed",
    "How quickly do you usually respond during active work periods?",
    "short_text",
    "Communication",
    { placeholder: "e.g. Within 1 hour on WhatsApp" }
  ),
  q(
    "availability_conflicts",
    "Are there any commitments that may affect your availability?",
    "long_text",
    "Trust and reliability",
    { required: false }
  ),
  q(
    "meets_deadlines",
    "Can you reliably meet agreed deadlines?",
    "yes_no",
    "Trust and reliability"
  ),
];

const CATEGORY_QUESTIONS: Partial<Record<RoleCategory, FollowUpQuestion[]>> = {
  content: [
    q(
      "sample_headline",
      "Write a short sample headline for Yike's homepage.",
      "short_text",
      "Role-specific",
      { placeholder: "One compelling headline" }
    ),
    q(
      "blog_topics",
      "Suggest 3 blog topics that could help Yike attract property seekers in Nigeria.",
      "long_text",
      "Role-specific"
    ),
    q(
      "seo_vs_human",
      "How do you balance SEO writing with human-friendly content?",
      "long_text",
      "Role-specific"
    ),
  ],
  marketing: [
    q(
      "content_ideas_social",
      "Suggest 3 content ideas for Yike on Instagram or TikTok.",
      "long_text",
      "Role-specific"
    ),
    q(
      "real_estate_content",
      "How would you make real estate content feel less boring?",
      "long_text",
      "Role-specific"
    ),
  ],
  photography: [
    q(
      "listing_photos",
      "How do you shoot property listings so they feel trustworthy on mobile?",
      "long_text",
      "Role-specific"
    ),
  ],
  support: [
    q(
      "angry_user",
      "How would you respond to an angry user who says an agent wasted their time?",
      "long_text",
      "Role-specific"
    ),
    q(
      "repeated_complaints",
      "How do you handle repeated complaints professionally?",
      "long_text",
      "Role-specific"
    ),
  ],
  operations: [
    q(
      "fake_listing_signals",
      "What signs would make you suspicious of a fake property listing?",
      "long_text",
      "Role-specific"
    ),
    q(
      "fast_review",
      "How would you review many listings quickly without missing risk signals?",
      "long_text",
      "Role-specific"
    ),
  ],
  growth: [
    q(
      "city_onboarding",
      "How would you onboard agents in your city?",
      "long_text",
      "Role-specific"
    ),
    q(
      "local_reach",
      "What areas do you know well and how would you reach property agents there?",
      "long_text",
      "Role-specific"
    ),
  ],
  field: [
    q(
      "inspection_approach",
      "How would you inspect a property and report findings honestly?",
      "long_text",
      "Role-specific"
    ),
    q(
      "agent_pressure",
      "What would you do if an agent tries to pressure you during verification?",
      "long_text",
      "Role-specific"
    ),
  ],
  office: [
    q(
      "document_issues",
      "What property document issues do you commonly watch for?",
      "long_text",
      "Role-specific"
    ),
    q(
      "conflict_of_interest",
      "How do you avoid conflict of interest when reviewing property documents?",
      "long_text",
      "Role-specific"
    ),
  ],
  tech: [
    q(
      "ship_fast",
      "Describe something you shipped quickly with limited specs.",
      "long_text",
      "Role-specific"
    ),
    q(
      "mobile_performance",
      "How do you keep web apps fast on Nigerian mobile networks?",
      "long_text",
      "Role-specific"
    ),
  ],
};

function missingDetailQuestions(input: FollowUpGenerationInput): FollowUpQuestion[] {
  const extras: FollowUpQuestion[] = [];
  const app = input.application;

  if (!app.portfolio && !app.linkedin) {
    extras.push(
      q(
        "portfolio_gap",
        "We did not see a portfolio link in your application — please share your best work samples.",
        "portfolio",
        "Follow-up",
        { required: true }
      )
    );
  }

  if (app.why_apply.length < 80) {
    extras.push(
      q(
        "why_yike_expand",
        "Your initial application was brief — tell us more about why Yike specifically.",
        "long_text",
        "Follow-up"
      )
    );
  }

  if (app.years_experience === 0) {
    extras.push(
      q(
        "experience_despite_years",
        "You listed 0 years experience — describe relevant projects, internships, or freelance work.",
        "long_text",
        "Follow-up"
      )
    );
  }

  return extras;
}

/** SEO writer roles may use content category — also match title keywords */
function resolveCategory(input: FollowUpGenerationInput): RoleCategory {
  const title = input.jobTitle.toLowerCase();
  if (/seo|writer|content|copy/i.test(title)) return "content";
  if (/support|customer/i.test(title)) return "support";
  if (/verif|field|inspector/i.test(title)) return "field";
  if (/legal|compliance/i.test(title)) return "office";
  if (/ambassador|growth|city/i.test(title)) return "growth";
  if (/review|trust|ops|moderation/i.test(title)) return "operations";
  if (/social|creator|tiktok|instagram/i.test(title)) return "marketing";
  return input.jobCategory;
}

export function generateFollowUpQuestions(
  input: FollowUpGenerationInput
): FollowUpQuestion[] {
  const category = resolveCategory(input);
  const categoryQs = CATEGORY_QUESTIONS[category] ?? [];

  const merged = [
    ...CORE_QUESTIONS,
    ...categoryQs,
    ...missingDetailQuestions(input),
  ];

  const seen = new Set<string>();
  return merged.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function scoreTextQuality(text: string, minWords = 25): number {
  const words = wordCount(text);
  if (words < 8) return 25;
  if (words < minWords) return 55;
  if (words < minWords * 2) return 75;
  return 90;
}

function parseSalaryNaira(text: string): number | null {
  const normalized = text.toLowerCase().replace(/,/g, "");
  const match = normalized.match(/(\d[\d.]*)\s*(k|m)?/);
  if (!match) return null;
  let n = parseFloat(match[1]);
  if (match[2] === "k") n *= 1000;
  if (match[2] === "m") n *= 1_000_000;
  return Number.isFinite(n) ? n : null;
}

export function scoreFollowUpResponses(
  questions: FollowUpQuestion[],
  answers: Record<string, string>
): {
  score: FollowUpResponseScore;
  recommendation: FollowUpRecommendation;
  redFlags: string[];
  strengths: string[];
} {
  const redFlags: string[] = [];
  const strengths: string[] = [];

  const longTexts = questions
    .filter((q) => q.type === "long_text" || q.type === "short_text")
    .map((q) => answers[q.id] ?? "")
    .filter(Boolean);

  const communicationClarity =
    longTexts.length === 0
      ? 40
      : Math.round(
          longTexts.reduce((sum, t) => sum + scoreTextQuality(t), 0) /
            longTexts.length
        );

  const roleAnswers = [
    answers.role_interest,
    answers.audience_understanding,
    answers.first_30_days,
  ].filter(Boolean);
  const roleFit =
    roleAnswers.length === 0
      ? 45
      : Math.round(
          roleAnswers.reduce((sum, t) => sum + scoreTextQuality(t, 20), 0) /
            roleAnswers.length
        );

  const experienceRelevance = scoreTextQuality(
    answers.relevant_experience ?? answers.experience_despite_years ?? "",
    30
  );

  const salaryText = answers.salary_expectation ?? "";
  const salaryAmount = parseSalaryNaira(salaryText);
  let salaryFit = 70;
  if (salaryAmount != null) {
    if (salaryAmount > 800_000) {
      salaryFit = 35;
      redFlags.push("Salary expectation appears high for early-stage contract roles");
    } else if (salaryAmount > 500_000) {
      salaryFit = 55;
    } else if (salaryAmount >= 80_000) {
      salaryFit = 85;
      strengths.push("Salary expectation within a reasonable band");
    }
  } else if (!salaryText.trim()) {
    salaryFit = 50;
    redFlags.push("No clear salary expectation provided");
  }

  const startText = (answers.start_date ?? "").toLowerCase();
  let availabilityFit = 60;
  if (/immediately|now|asap|ready|this week/i.test(startText)) {
    availabilityFit = 90;
    strengths.push("Can start soon");
  } else if (startText.trim()) {
    availabilityFit = 75;
  } else {
    redFlags.push("Start date not specified");
  }

  const meetsDeadlines = (answers.meets_deadlines ?? "").toLowerCase();
  let reliabilitySignals = 65;
  if (meetsDeadlines === "yes") reliabilitySignals = 88;
  if (meetsDeadlines === "no") {
    reliabilitySignals = 30;
    redFlags.push("Applicant indicated they may not reliably meet deadlines");
  }

  const pressureHandling = Math.round(
    (scoreTextQuality(answers.changing_priorities ?? "", 15) +
      scoreTextQuality(answers.under_pressure ?? "", 15)) /
      2
  );

  const portfolioText = answers.work_samples ?? answers.portfolio_gap ?? "";
  let portfolioQuality = 50;
  if (/https?:\/\//i.test(portfolioText)) {
    portfolioQuality = 85;
    strengths.push("Shared portfolio or work links");
  } else if (portfolioText.trim().length > 40) {
    portfolioQuality = 65;
  } else {
    redFlags.push("Limited portfolio evidence in follow-up");
  }

  const overall = Math.round(
    communicationClarity * 0.2 +
      roleFit * 0.2 +
      experienceRelevance * 0.15 +
      salaryFit * 0.1 +
      availabilityFit * 0.1 +
      reliabilitySignals * 0.1 +
      pressureHandling * 0.075 +
      portfolioQuality * 0.075
  );

  const score: FollowUpResponseScore = {
    communicationClarity,
    roleFit,
    experienceRelevance,
    salaryFit,
    availabilityFit,
    reliabilitySignals,
    pressureHandling,
    portfolioQuality,
    overall,
  };

  let recommendation: FollowUpRecommendation = "unclear";
  if (overall >= 78 && redFlags.length === 0) recommendation = "strong_fit";
  else if (overall >= 68) recommendation = "possible_fit";
  else if (overall >= 58) recommendation = "needs_interview";
  else if (salaryFit < 45) recommendation = "too_expensive";
  else if (overall < 45 || redFlags.length >= 3) recommendation = "not_suitable";

  if (communicationClarity >= 80) strengths.push("Clear written communication");
  if (roleFit >= 75) strengths.push("Good understanding of the role");

  return { score, recommendation, redFlags, strengths };
}

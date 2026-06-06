import type { RoleCategory, RoleQuestion, ScoringCriteria } from "./constants";

type JobInput = {
  title: string;
  department: string;
  category: RoleCategory;
  location: string;
  requirements: string;
  shortDescription: string;
};

const CATEGORY_SKILLS: Record<RoleCategory, string[]> = {
  marketing: ["content writing", "social media", "campaigns", "analytics", "brand"],
  office: ["scheduling", "documentation", "MS Office", "Google Workspace", "coordination"],
  support: ["WhatsApp support", "customer care", "conflict resolution", "patience", "Nigerian Pidgin"],
  field: ["on-ground verification", "local knowledge", "mobility", "relationship building"],
  operations: ["process management", "logistics", "vendor coordination", "reporting"],
  content: ["short-form video", "copywriting", "storytelling", "trend awareness"],
  photography: ["property photography", "lighting", "mobile editing", "consistency"],
  growth: ["user acquisition", "partnerships", "experiments", "funnels", "retention"],
  tech: ["TypeScript", "React", "Next.js", "APIs", "mobile performance", "Supabase"],
};

const CATEGORY_KEYWORDS: Record<RoleCategory, string[]> = {
  marketing: ["growth", "content", "ads", "instagram", "tiktok", "campaign", "brand"],
  office: ["organised", "calendar", "admin", "communication", "excel", "docs"],
  support: ["customer", "whatsapp", "help", "resolve", "friendly", "patient"],
  field: ["agent", "inspect", "visit", "local", "trust", "verify"],
  operations: ["process", "coordinate", "scale", "report", "efficiency"],
  content: ["video", "reel", "script", "creative", "engagement", "story"],
  photography: ["photo", "shoot", "listing", "visual", "camera", "edit"],
  growth: ["acquisition", "retention", "experiment", "partnership", "funnel"],
  tech: ["react", "next", "typescript", "api", "database", "deploy", "mobile"],
};

const CATEGORY_QUESTIONS: Record<RoleCategory, RoleQuestion[]> = {
  marketing: [
    {
      id: "content_experience",
      label: "Describe your content or campaign experience",
      type: "textarea",
      placeholder: "Pages you ran, posts that performed, tools you used…",
      required: true,
    },
    {
      id: "audience_growth",
      label: "Have you grown an audience or page before?",
      type: "textarea",
      placeholder: "Followers gained, engagement, niche…",
    },
    {
      id: "ad_experience",
      label: "Any paid ads or performance marketing experience?",
      type: "textarea",
      placeholder: "Meta ads, Google, influencers — what worked?",
    },
  ],
  office: [
    {
      id: "tools_proficiency",
      label: "Which office tools are you strongest with?",
      type: "text",
      placeholder: "Google Workspace, Excel, Notion, scheduling tools…",
      required: true,
    },
    {
      id: "organization_style",
      label: "How do you stay organised under pressure?",
      type: "textarea",
      placeholder: "Systems, checklists, communication habits…",
      required: true,
    },
  ],
  support: [
    {
      id: "communication_style",
      label: "How would you handle an upset customer on WhatsApp?",
      type: "textarea",
      required: true,
    },
    {
      id: "availability_hours",
      label: "What hours can you reliably work?",
      type: "text",
      placeholder: "e.g. Mon–Sat 9am–6pm WAT",
      required: true,
    },
    {
      id: "conflict_resolution",
      label: "Share a time you resolved a difficult situation",
      type: "textarea",
    },
  ],
  field: [
    {
      id: "local_knowledge",
      label: "Which cities or areas do you know well on the ground?",
      type: "text",
      required: true,
    },
    {
      id: "mobility",
      label: "Do you have reliable mobility for field visits?",
      type: "select",
      options: ["Yes — own transport", "Yes — public transport", "Limited mobility"],
      required: true,
    },
  ],
  operations: [
    {
      id: "process_experience",
      label: "Describe operations or coordination work you've done",
      type: "textarea",
      required: true,
    },
    {
      id: "reporting_habits",
      label: "How do you track tasks and report progress?",
      type: "textarea",
    },
  ],
  content: [
    {
      id: "content_samples",
      label: "Link or describe content you've created",
      type: "textarea",
      required: true,
    },
    {
      id: "platform_strength",
      label: "Which platform do you create best for?",
      type: "select",
      options: ["TikTok", "Instagram", "YouTube", "X", "Multiple"],
      required: true,
    },
  ],
  photography: [
    {
      id: "gear_setup",
      label: "What gear or phone setup do you shoot with?",
      type: "text",
      required: true,
    },
    {
      id: "portfolio_samples",
      label: "Share property or real-estate style samples",
      type: "textarea",
      placeholder: "Links to Instagram, Drive folder, or describe shoots…",
      required: true,
    },
  ],
  growth: [
    {
      id: "growth_wins",
      label: "Share a growth win you're proud of",
      type: "textarea",
      required: true,
    },
    {
      id: "experiment_mindset",
      label: "How do you test what works vs what doesn't?",
      type: "textarea",
    },
  ],
  tech: [
    {
      id: "stack_experience_detail",
      label: "Which frameworks and tools have you shipped with?",
      type: "textarea",
      placeholder: "React, Next.js, Flutter, Postgres…",
      required: true,
    },
    {
      id: "deployment_experience",
      label: "Describe something you built and deployed",
      type: "textarea",
      required: true,
    },
  ],
};

function inferExperienceLevel(title: string, requirements: string): string {
  const text = `${title} ${requirements}`.toLowerCase();
  if (/\b(senior|lead|principal|head of|manager)\b/.test(text)) return "senior";
  if (/\b(intern|graduate|entry|junior|trainee)\b/.test(text)) return "entry";
  return "mid";
}

function extractKeywords(requirements: string, category: RoleCategory): string[] {
  const base = CATEGORY_KEYWORDS[category];
  const fromReq = requirements
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((w) => w.length > 3)
    .slice(0, 12);
  return [...new Set([...base, ...fromReq])];
}

function preferredLocations(location: string): string[] {
  return location
    .split(/[,/&]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function generateJobIntelligence(input: JobInput): {
  role_questions: RoleQuestion[];
  scoring_criteria: ScoringCriteria;
  required_skills: string[];
  experience_level: string;
} {
  const category = input.category;
  const experience_level = inferExperienceLevel(input.title, input.requirements);

  const role_questions = [...(CATEGORY_QUESTIONS[category] ?? [])];

  const scoring_criteria: ScoringCriteria = {
    keywords: extractKeywords(input.requirements, category),
    minExperience:
      experience_level === "senior" ? 4 : experience_level === "entry" ? 0 : 2,
    preferredLocations: preferredLocations(input.location),
    skillsWeight: category === "tech" ? 0.25 : 0.2,
    socialWeight: ["marketing", "content", "growth", "photography"].includes(category)
      ? 0.15
      : 0.08,
    communicationMinWords: 25,
  };

  const required_skills = [
    ...CATEGORY_SKILLS[category],
    ...input.department.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
  ].slice(0, 10);

  return {
    role_questions,
    scoring_criteria,
    required_skills: [...new Set(required_skills)],
    experience_level,
  };
}

export function buildJobSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "role"}-${suffix}`;
}

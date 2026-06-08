/**
 * Publish the Content & SEO Writer role on Yike careers.
 *
 * Usage (production or local Supabase):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/publish-content-seo-writer-job.mjs
 *
 * SQL-only (paste in Supabase SQL Editor):
 *   node scripts/publish-content-seo-writer-job.mjs --sql
 */

import { createClient } from "@supabase/supabase-js";

const JOB = {
  slug: "content-seo-writer",
  title: "Content & SEO Writer",
  department: "Growth & Content",
  category: "content",
  location: "Remote / Nigeria",
  job_type: "contract",
  experience_level: "mid",
  short_description:
    "Yike is building a smarter property marketplace for Nigeria. Help us communicate clearly, grow organic visibility, and create useful content that builds trust across web, search, and social.",
  responsibilities: [
    "Write clear, engaging website and landing page copy",
    "Create SEO-focused blog content around real estate, renting, buying, safety, and property trends in Nigeria",
    "Help improve search visibility through structured content strategy",
    "Write educational and trust-focused content for users",
    "Support social media and campaign messaging when needed",
    "Help simplify complex topics into easy-to-understand language",
    "Collaborate with product and growth teams on messaging improvements",
  ].join("\n"),
  requirements: [
    "Strong writing and communication skills",
    "Experience with SEO content writing",
    "Ability to write for real people, not just algorithms",
    "Research-driven mindset",
    "Clean, modern writing style",
    "Familiarity with Nigerian digital audiences is a plus",
    "Portfolio or writing samples required",
  ].join("\n"),
  required_skills: [
    "Startup experience",
    "Marketplace, fintech, or proptech writing",
    "Content analytics and search performance",
    "SEO",
    "Copywriting",
    "Blog writing",
    "Nigerian audience",
  ],
  role_questions: [
    {
      id: "writing_samples",
      label: "Share writing samples or portfolio links",
      type: "textarea",
      placeholder: "Blog posts, landing pages, articles, or a portfolio link…",
      required: true,
    },
    {
      id: "seo_experience",
      label: "Describe your SEO content experience",
      type: "textarea",
      placeholder: "Topics you've ranked for, tools you use, content strategy work…",
      required: true,
    },
    {
      id: "real_estate_content",
      label: "Have you written about real estate, renting, or buying before?",
      type: "textarea",
      placeholder: "Examples, niches, or how you'd approach property content in Nigeria…",
    },
  ],
  scoring_criteria: {
    keywords: [
      "seo",
      "content",
      "writing",
      "blog",
      "copy",
      "portfolio",
      "research",
      "nigeria",
      "real estate",
      "property",
      "organic",
      "search",
    ],
    minExperience: 2,
    preferredLocations: ["remote", "nigeria"],
    skillsWeight: 0.2,
    socialWeight: 0.12,
    communicationMinWords: 25,
  },
};

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function toJson(value) {
  return `'${sqlEscape(JSON.stringify(value))}'::jsonb`;
}

function generateSql() {
  const now = new Date().toISOString();
  return `-- Publish Content & SEO Writer role
INSERT INTO public.jobs (
  slug,
  title,
  department,
  category,
  location,
  job_type,
  salary_min,
  salary_max,
  short_description,
  responsibilities,
  requirements,
  role_questions,
  scoring_criteria,
  required_skills,
  experience_level,
  status,
  published_at
) VALUES (
  '${sqlEscape(JOB.slug)}',
  '${sqlEscape(JOB.title)}',
  '${sqlEscape(JOB.department)}',
  '${JOB.category}'::public.role_category,
  '${sqlEscape(JOB.location)}',
  '${JOB.job_type}'::public.job_type,
  NULL,
  NULL,
  '${sqlEscape(JOB.short_description)}',
  '${sqlEscape(JOB.responsibilities)}',
  '${sqlEscape(JOB.requirements)}',
  ${toJson(JOB.role_questions)},
  ${toJson(JOB.scoring_criteria)},
  ${toJson(JOB.required_skills)},
  '${JOB.experience_level}',
  'published'::public.job_status,
  '${now}'::timestamptz
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  job_type = EXCLUDED.job_type,
  short_description = EXCLUDED.short_description,
  responsibilities = EXCLUDED.responsibilities,
  requirements = EXCLUDED.requirements,
  role_questions = EXCLUDED.role_questions,
  scoring_criteria = EXCLUDED.scoring_criteria,
  required_skills = EXCLUDED.required_skills,
  experience_level = EXCLUDED.experience_level,
  status = EXCLUDED.status,
  published_at = COALESCE(public.jobs.published_at, EXCLUDED.published_at),
  updated_at = now();
`;
}

async function publish() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin
    .from("jobs")
    .select("id, slug, status")
    .eq("slug", JOB.slug)
    .maybeSingle();

  const row = {
    slug: JOB.slug,
    title: JOB.title,
    department: JOB.department,
    category: JOB.category,
    location: JOB.location,
    job_type: JOB.job_type,
    salary_min: null,
    salary_max: null,
    short_description: JOB.short_description,
    responsibilities: JOB.responsibilities,
    requirements: JOB.requirements,
    role_questions: JOB.role_questions,
    scoring_criteria: JOB.scoring_criteria,
    required_skills: JOB.required_skills,
    experience_level: JOB.experience_level,
    status: "published",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await admin.from("jobs").update(row).eq("id", existing.id);
    if (error) throw error;
    console.log(`Updated existing job: /careers/${JOB.slug}`);
    return;
  }

  const { error } = await admin.from("jobs").insert(row);
  if (error) throw error;
  console.log(`Published new job: /careers/${JOB.slug}`);
}

async function main() {
  if (process.argv.includes("--sql")) {
    process.stdout.write(generateSql());
    return;
  }
  await publish();
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

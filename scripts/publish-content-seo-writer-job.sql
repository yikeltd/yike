-- Publish Content & SEO Writer role
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
  'content-seo-writer',
  'Content & SEO Writer',
  'Growth & Content',
  'content'::public.role_category,
  'Remote / Nigeria',
  'contract'::public.job_type,
  NULL,
  NULL,
  'Yike is building a smarter property marketplace for Nigeria. Help us communicate clearly, grow organic visibility, and create useful content that builds trust across web, search, and social.',
  'Write clear, engaging website and landing page copy
Create SEO-focused blog content around real estate, renting, buying, safety, and property trends in Nigeria
Help improve search visibility through structured content strategy
Write educational and trust-focused content for users
Support social media and campaign messaging when needed
Help simplify complex topics into easy-to-understand language
Collaborate with product and growth teams on messaging improvements',
  'Strong writing and communication skills
Experience with SEO content writing
Ability to write for real people, not just algorithms
Research-driven mindset
Clean, modern writing style
Familiarity with Nigerian digital audiences is a plus
Portfolio or writing samples required',
  '[{"id":"writing_samples","label":"Share writing samples or portfolio links","type":"textarea","placeholder":"Blog posts, landing pages, articles, or a portfolio link…","required":true},{"id":"seo_experience","label":"Describe your SEO content experience","type":"textarea","placeholder":"Topics you''ve ranked for, tools you use, content strategy work…","required":true},{"id":"real_estate_content","label":"Have you written about real estate, renting, or buying before?","type":"textarea","placeholder":"Examples, niches, or how you''d approach property content in Nigeria…"}]'::jsonb,
  '{"keywords":["seo","content","writing","blog","copy","portfolio","research","nigeria","real estate","property","organic","search"],"minExperience":2,"preferredLocations":["remote","nigeria"],"skillsWeight":0.2,"socialWeight":0.12,"communicationMinWords":25}'::jsonb,
  '["Startup experience","Marketplace, fintech, or proptech writing","Content analytics and search performance","SEO","Copywriting","Blog writing","Nigerian audience"]'::jsonb,
  'mid',
  'published'::public.job_status,
  '2026-06-08T22:48:57.233Z'::timestamptz
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

-- Careers recruitment system

create type public.job_type as enum (
  'full_time',
  'part_time',
  'remote',
  'hybrid',
  'internship',
  'contract'
);

create type public.role_category as enum (
  'marketing',
  'office',
  'support',
  'field',
  'operations',
  'content',
  'photography',
  'growth',
  'tech'
);

create type public.job_status as enum (
  'draft',
  'published',
  'closed',
  'archived'
);

create type public.application_status as enum (
  'submitted',
  'shortlisted',
  'review',
  'low_priority',
  'rejected',
  'approved',
  'interview',
  'archived'
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  department text not null,
  category public.role_category not null,
  location text not null,
  job_type public.job_type not null default 'full_time',
  salary_min numeric,
  salary_max numeric,
  short_description text not null,
  requirements text not null,
  role_questions jsonb not null default '[]'::jsonb,
  scoring_criteria jsonb not null default '{}'::jsonb,
  required_skills jsonb not null default '[]'::jsonb,
  experience_level text not null default 'mid',
  status public.job_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  full_name text not null,
  email text not null,
  whatsapp text not null,
  address text,
  city text not null,
  state text not null,
  age_range text not null,
  education_level text not null,
  current_occupation text not null,
  why_apply text not null,
  years_experience integer not null default 0,
  cv_url text,
  facebook text,
  instagram text,
  tiktok text,
  github text,
  linkedin text,
  portfolio text,
  stack_experience text,
  extra_answers jsonb not null default '{}'::jsonb,
  score integer not null default 0 check (score >= 0 and score <= 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  status public.application_status not null default 'submitted',
  source text not null default 'careers',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  viewed_at timestamptz
);

create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications (id) on delete cascade,
  admin_id uuid references public.profiles (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index jobs_status_idx on public.jobs (status);
create index jobs_category_idx on public.jobs (category);
create index job_applications_job_id_idx on public.job_applications (job_id);
create index job_applications_status_idx on public.job_applications (status);
create index job_applications_score_idx on public.job_applications (score desc);
create index job_applications_created_idx on public.job_applications (created_at desc);

alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.application_notes enable row level security;

create policy "Public read published jobs"
  on public.jobs
  for select
  using (status = 'published');

create policy "Admin manage jobs"
  on public.jobs
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

create policy "Admin read applications"
  on public.job_applications
  for select
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

create policy "Admin update applications"
  on public.job_applications
  for update
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

create policy "Admin manage application notes"
  on public.application_notes
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'career-cvs',
  'career-cvs',
  false,
  5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create policy "Service role uploads career cvs"
  on storage.objects
  for insert
  with check (bucket_id = 'career-cvs');

create policy "Admin read career cvs"
  on storage.objects
  for select
  using (
    bucket_id = 'career-cvs'
    and exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

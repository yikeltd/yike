-- Allow anyone to apply to published roles (no service role required)
create policy "Public submit applications to published jobs"
  on public.job_applications
  for insert
  with check (
    exists (
      select 1
      from public.jobs
      where jobs.id = job_id
        and jobs.status = 'published'
    )
  );

-- Allow CV uploads from the application form
create policy "Public upload career cvs"
  on storage.objects
  for insert
  with check (bucket_id = 'career-cvs');

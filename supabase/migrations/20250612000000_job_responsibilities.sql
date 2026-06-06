-- Separate role responsibilities from hero summary
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS responsibilities text NOT NULL DEFAULT '';

-- Backfill legacy roles that stored the full pitch in short_description
UPDATE public.jobs
SET
  short_description = 'Join Yike as a Field Verification Agent and help us eliminate housing fraud.',
  responsibilities = E'Visit listed properties and confirm they match the listing\nVerify landlord or agent identity on site\nInspect property condition and compare to listing photos\nEnsure listings are 100% authentic before they go live on Yike'
WHERE responsibilities = ''
  AND (
    title ILIKE '%field verification%'
    OR short_description ILIKE '%field verification agent%'
  );

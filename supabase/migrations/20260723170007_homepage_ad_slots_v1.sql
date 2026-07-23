-- Homepage smart ad slots 1–5 (extend existing advertisements placements).
-- Founder must apply — do not auto-push.

ALTER TABLE public.advertisements
  DROP CONSTRAINT IF EXISTS advertisements_placement_check;

ALTER TABLE public.advertisements
  ADD CONSTRAINT advertisements_placement_check
  CHECK (placement IN (
    'homepage_top',
    'homepage_middle',
    'search_results',
    'homepage_slot_1',
    'homepage_slot_2',
    'homepage_slot_3',
    'homepage_slot_4',
    'homepage_slot_5'
  ));

COMMENT ON TABLE public.advertisements IS
  'Sponsored placements — max one active per placement. Homepage slots 1–5 render only when live; layout collapses when empty.';

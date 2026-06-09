-- Ensure the property_leads compatibility view uses the querying role's
-- permissions/RLS context instead of the view owner's privileges.

ALTER VIEW public.property_leads
  SET (security_invoker = true);

GRANT SELECT ON public.property_leads TO service_role;

NOTIFY pgrst, 'reload schema';

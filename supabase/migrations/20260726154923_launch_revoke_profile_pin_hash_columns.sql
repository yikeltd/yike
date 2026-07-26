-- Launch hardening: revoke client SELECT/UPDATE/INSERT on PIN hash columns.
-- PIN verification stays via SECURITY DEFINER RPC (yike_pin_login_lookup) and
-- service_role admin clients in server API routes.
-- Project: hlpojfurfldvcxfxhveg

REVOKE SELECT (pin_hash, admin_pin_hash) ON TABLE public.profiles FROM anon, authenticated;
REVOKE UPDATE (pin_hash, admin_pin_hash) ON TABLE public.profiles FROM anon, authenticated;
REVOKE INSERT (pin_hash, admin_pin_hash) ON TABLE public.profiles FROM anon, authenticated;

-- Ensure server roles retain access (service_role used by API + SECURITY DEFINER).
GRANT SELECT (pin_hash, admin_pin_hash) ON TABLE public.profiles TO service_role, postgres;
GRANT UPDATE (pin_hash, admin_pin_hash) ON TABLE public.profiles TO service_role, postgres;
GRANT INSERT (pin_hash, admin_pin_hash) ON TABLE public.profiles TO service_role, postgres;

COMMENT ON COLUMN public.profiles.pin_hash IS
  'Consumer PIN hash — never selectable by anon/authenticated; use RPC or service_role.';
COMMENT ON COLUMN public.profiles.admin_pin_hash IS
  'Staff admin PIN hash — never selectable by anon/authenticated; use service_role.';

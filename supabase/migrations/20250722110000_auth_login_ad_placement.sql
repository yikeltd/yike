INSERT INTO ad_placements (placement_key, label) VALUES
  ('auth_login_footer', 'Sign in — below Terms & Privacy')
ON CONFLICT (placement_key) DO NOTHING;

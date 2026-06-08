-- Transactional email sponsor slot — manage at /lex/auth/email-ads

INSERT INTO ad_placements (placement_key, label) VALUES
  ('email_transactional', 'Transactional email — under headline')
ON CONFLICT (placement_key) DO NOTHING;

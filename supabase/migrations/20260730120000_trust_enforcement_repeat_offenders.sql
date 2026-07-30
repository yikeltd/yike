-- Yike Trust & Safety Engine — Pass 2: Enforcement Engine & Repeat Offender Detection
-- Created: 2026-07-30

-- 1. Linked Accounts Table (Repeat Offender Detection)
CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confidence_score INT NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  link_reasons TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'confirmed', 'dismissed', 'monitoring')),
  moderator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT linked_accounts_unique_pair UNIQUE (primary_user_id, linked_user_id)
);

CREATE INDEX IF NOT EXISTS linked_accounts_primary_idx ON linked_accounts (primary_user_id);
CREATE INDEX IF NOT EXISTS linked_accounts_linked_idx ON linked_accounts (linked_user_id);
CREATE INDEX IF NOT EXISTS linked_accounts_status_idx ON linked_accounts (status);

ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;

-- 2. Function to check if a user is visibility restricted, suspended, or banned
CREATE OR REPLACE FUNCTION is_user_visibility_restricted(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trust_profiles
    WHERE user_id = target_user_id
      AND (
        trust_status IN ('restricted', 'suspended', 'banned')
        OR permanent_ban_flag = TRUE
      )
  );
$$;

-- 3. Ensure profiles table includes enforcement metadata columns if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enforcement_level TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_visibility_restricted BOOLEAN NOT NULL DEFAULT FALSE;

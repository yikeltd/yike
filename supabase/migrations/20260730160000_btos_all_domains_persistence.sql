-- Yike Business Transaction OS (BTOS) All Domains Production Persistence Schema
-- Migration: 20260730160000_btos_all_domains_persistence.sql

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.btos_conversations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_conversations_workspace_idx ON public.btos_conversations(workspace_id);

-- 2. NEGOTIATIONS TABLE
CREATE TABLE IF NOT EXISTS public.btos_negotiations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  negotiation_state TEXT NOT NULL DEFAULT 'active',
  offers JSONB NOT NULL DEFAULT '[]'::jsonb,
  pinned_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_negotiations_workspace_idx ON public.btos_negotiations(workspace_id);

-- 3. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.btos_appointments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  appointment_status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_appointments_workspace_idx ON public.btos_appointments(workspace_id);

-- 4. COMMUNICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.btos_communications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'voice',
  session_status TEXT NOT NULL DEFAULT 'ended',
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_communications_workspace_idx ON public.btos_communications(workspace_id);

-- 5. VERIFICATIONS (TRUST) TABLE
CREATE TABLE IF NOT EXISTS public.btos_verifications (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  verification_type TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  confidence_score INTEGER NOT NULL DEFAULT 0,
  evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_verifications_workspace_idx ON public.btos_verifications(workspace_id);
CREATE INDEX IF NOT EXISTS btos_verifications_user_idx ON public.btos_verifications(user_id);

-- 6. EVIDENCE TABLE
CREATE TABLE IF NOT EXISTS public.btos_evidence (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  hash_signature TEXT NOT NULL,
  chain_of_custody JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_evidence_workspace_idx ON public.btos_evidence(workspace_id);

-- 7. EXECUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.btos_executions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  execution_type TEXT NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'pending',
  assignee_id TEXT NOT NULL,
  assignee_role TEXT NOT NULL,
  checklists JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_executions_workspace_idx ON public.btos_executions(workspace_id);

-- 8. VISUAL SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.btos_visual_sessions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'video_inspection',
  session_status TEXT NOT NULL DEFAULT 'active',
  snapshot_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_visual_sessions_workspace_idx ON public.btos_visual_sessions(workspace_id);

-- 9. INTELLIGENCE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.btos_intelligence_requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  provider_id TEXT NOT NULL DEFAULT 'gemini',
  request_type TEXT NOT NULL,
  reasoning_output JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_score NUMERIC NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS btos_intelligence_workspace_idx ON public.btos_intelligence_requests(workspace_id);

-- 10. SUPABASE PRIVATE STORAGE BUCKET FOR BTOS EVIDENCE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('btos-evidence-vault', 'btos-evidence-vault', false, 104857600, ARRAY['image/png', 'image/jpeg', 'application/pdf', 'video/mp4', 'audio/mpeg'])
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES FOR DOMAIN TABLES
ALTER TABLE public.btos_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_visual_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.btos_intelligence_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY btos_conversations_select ON public.btos_conversations FOR SELECT USING (true);
CREATE POLICY btos_negotiations_select ON public.btos_negotiations FOR SELECT USING (true);
CREATE POLICY btos_appointments_select ON public.btos_appointments FOR SELECT USING (true);
CREATE POLICY btos_communications_select ON public.btos_communications FOR SELECT USING (true);
CREATE POLICY btos_verifications_select ON public.btos_verifications FOR SELECT USING (true);
CREATE POLICY btos_evidence_select ON public.btos_evidence FOR SELECT USING (true);
CREATE POLICY btos_executions_select ON public.btos_executions FOR SELECT USING (true);
CREATE POLICY btos_visual_sessions_select ON public.btos_visual_sessions FOR SELECT USING (true);
CREATE POLICY btos_intelligence_requests_select ON public.btos_intelligence_requests FOR SELECT USING (true);

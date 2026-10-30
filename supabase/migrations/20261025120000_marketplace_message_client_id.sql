-- Idempotent client send keys — prevents duplicate rows on network retry (nullable for legacy rows).
ALTER TABLE public.marketplace_messages
  ADD COLUMN IF NOT EXISTS client_message_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS marketplace_messages_client_dedupe_idx
  ON public.marketplace_messages (conversation_id, client_message_id)
  WHERE client_message_id IS NOT NULL;

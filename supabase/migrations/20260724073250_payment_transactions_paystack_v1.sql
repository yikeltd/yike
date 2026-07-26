-- Production Paystack architecture: extend payment_orders + transactions view
-- Verified against project hlpojfurfldvcxfxhveg before authoring.
-- Do not apply until founder confirms; code tolerates missing columns via optional selects.

-- ---------------------------------------------------------------------------
-- 1) Extend payment_orders with gateway audit fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS listing_id UUID,
  ADD COLUMN IF NOT EXISTS paystack_reference TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT,
  ADD COLUMN IF NOT EXISTS fees NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS gateway TEXT,
  ADD COLUMN IF NOT EXISTS gateway_response JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.payment_orders.listing_id IS
  'Optional listing being promoted/boosted; null for subscriptions and non-listing products.';
COMMENT ON COLUMN public.payment_orders.paystack_reference IS
  'Gateway reference returned by Paystack (usually matches our reference).';
COMMENT ON COLUMN public.payment_orders.channel IS
  'Paystack channel e.g. card, bank, ussd, qr.';
COMMENT ON COLUMN public.payment_orders.fees IS
  'Gateway fees in major currency units (NGN), when available.';
COMMENT ON COLUMN public.payment_orders.gateway IS
  'Active gateway for this row (paystack, flutterwave, monnify, stripe, wallet).';
COMMENT ON COLUMN public.payment_orders.gateway_response IS
  'Sanitized gateway verify payload for audit (never store secrets).';

-- Backfill gateway from provider
UPDATE public.payment_orders
SET gateway = provider
WHERE gateway IS NULL
  AND provider IS NOT NULL;

-- Backfill listing_id from metadata when present and valid UUID text
UPDATE public.payment_orders
SET listing_id = (metadata->>'listing_id')::uuid
WHERE listing_id IS NULL
  AND metadata ? 'listing_id'
  AND (metadata->>'listing_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

CREATE INDEX IF NOT EXISTS payment_orders_listing_idx
  ON public.payment_orders (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_orders_paystack_reference_idx
  ON public.payment_orders (paystack_reference)
  WHERE paystack_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_orders_gateway_status_idx
  ON public.payment_orders (COALESCE(gateway, provider), status, created_at DESC);

-- Expand purpose / order_type for unified payment products (future escrow/wallet-ready)
ALTER TABLE public.payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_order_type_check;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_order_type_check
  CHECK (
    order_type IN (
      'featured_listing',
      'boost_listing',
      'property_verification',
      'verification_fee',
      'advertisement',
      'subscription',
      'lead_insights',
      'listing_fee',
      'premium_seller',
      'vehicle_boost',
      'property_boost',
      'escrow_hold',
      'wallet_topup'
    )
  );

-- Status set already matches: pending, processing, successful, failed, cancelled, refunded

-- ---------------------------------------------------------------------------
-- 2) Canonical transactions view (SSOT remains payment_orders)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.transactions
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  listing_id,
  order_type AS purpose,
  amount,
  currency,
  reference,
  paystack_reference,
  status,
  channel,
  fees,
  metadata,
  COALESCE(gateway, provider, 'paystack') AS gateway,
  gateway_response,
  provider,
  entity_id,
  order_type,
  paid_at,
  created_at,
  updated_at
FROM public.payment_orders;

COMMENT ON VIEW public.transactions IS
  'Unified payment transactions view over payment_orders. Activation must never trust callback alone — webhook + Paystack verify is source of truth.';

GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT ON public.transactions TO service_role;

-- ---------------------------------------------------------------------------
-- 3) Webhook audit convenience indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS paystack_webhook_events_reference_idx
  ON public.paystack_webhook_events (reference, created_at DESC)
  WHERE reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS paystack_webhook_events_status_idx
  ON public.paystack_webhook_events (status, created_at DESC);

NOTIFY pgrst, 'reload schema';

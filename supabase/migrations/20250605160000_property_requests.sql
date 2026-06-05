-- Tenant/buyer property requests — demand discovery & lead gen

CREATE TABLE property_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  area TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  listing_type TEXT NOT NULL DEFAULT 'rent'
    CHECK (listing_type IN ('rent', 'lease', 'sale', 'shortlet')),
  property_type TEXT,
  bedrooms INT,
  whatsapp TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'contacted', 'matched', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX property_requests_status_idx ON property_requests (status, created_at DESC);
CREATE INDEX property_requests_city_idx ON property_requests (city);

ALTER TABLE property_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit property request"
  ON property_requests FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins read property requests"
  ON property_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_banned = FALSE
    )
  );

CREATE POLICY "Admins update property requests"
  ON property_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_banned = FALSE
    )
  );

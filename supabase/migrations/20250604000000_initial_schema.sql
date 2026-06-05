-- Yike.ng initial schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin', 'super_admin')),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  agent_type TEXT CHECK (agent_type IN ('independent', 'agency', 'landlord')),
  trust_score INT NOT NULL DEFAULT 100,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent verifications
CREATE TABLE agent_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nin_number_encrypted TEXT,
  selfie_url TEXT,
  id_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  listing_type TEXT NOT NULL DEFAULT 'rent' CHECK (listing_type IN ('rent', 'sale', 'shortlet')),
  property_type TEXT CHECK (property_type IN (
    'self_contain', 'mini_flat', 'flat', 'duplex', 'bungalow',
    'room', 'shop', 'office', 'land'
  )),
  bedrooms INT NOT NULL DEFAULT 0,
  bathrooms INT NOT NULL DEFAULT 0,
  toilets INT NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL,
  payment_period TEXT NOT NULL DEFAULT 'yearly'
    CHECK (payment_period IN ('yearly', 'monthly', 'daily', 'total')),
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  address_hint TEXT,
  landmark TEXT,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'rented', 'hidden', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified_listing BOOLEAN NOT NULL DEFAULT FALSE,
  views_count INT NOT NULL DEFAULT 0,
  contact_clicks INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX properties_public_idx ON properties (status, is_featured, created_at DESC)
  WHERE status = 'approved';
CREATE INDEX properties_city_area_idx ON properties (city, area);
CREATE INDEX properties_agent_idx ON properties (agent_id);

-- Listing reports
CREATE TABLE listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reporter_name TEXT,
  reporter_phone TEXT,
  reason TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

-- Featured boosts
CREATE TABLE featured_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Hide listing after 3 open reports
CREATE OR REPLACE FUNCTION handle_listing_report()
RETURNS TRIGGER AS $$
DECLARE
  open_count INT;
BEGIN
  SELECT COUNT(*) INTO open_count
  FROM listing_reports
  WHERE property_id = NEW.property_id AND status = 'open';

  IF open_count >= 3 THEN
    UPDATE properties SET status = 'hidden' WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_listing_report_created
  AFTER INSERT ON listing_reports
  FOR EACH ROW EXECUTE FUNCTION handle_listing_report();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_boosts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public can view non-banned agent profiles"
  ON profiles FOR SELECT
  USING (is_banned = FALSE);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Properties: public sees approved, non-expired
CREATE POLICY "Public read approved active listings"
  ON properties FOR SELECT
  USING (
    status = 'approved'
    AND expires_at > NOW()
    OR agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'super_admin')
        AND p.is_banned = FALSE
    )
  );

CREATE POLICY "Agents insert own listings"
  ON properties FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('agent', 'admin', 'super_admin')
        AND is_banned = FALSE
    )
  );

CREATE POLICY "Agents update own listings"
  ON properties FOR UPDATE
  USING (agent_id = auth.uid());

CREATE POLICY "Admins manage all listings"
  ON properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND is_banned = FALSE
    )
  );

-- Listing reports: anyone can report (anon via service or authenticated)
CREATE POLICY "Anyone can create reports"
  ON listing_reports FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins read reports"
  ON listing_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins update reports"
  ON listing_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Favorites
CREATE POLICY "Users manage own favorites"
  ON favorites FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Agent verifications
CREATE POLICY "Agents manage own verification"
  ON agent_verifications FOR ALL
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Admins read verifications"
  ON agent_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins update verifications"
  ON agent_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Featured boosts
CREATE POLICY "Agents read own boosts"
  ON featured_boosts FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Admins manage boosts"
  ON featured_boosts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Increment views (callable by anon/authenticated)
CREATE OR REPLACE FUNCTION increment_property_views(property_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE properties SET views_count = views_count + 1 WHERE id = property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_contact_clicks(property_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE properties SET contact_clicks = contact_clicks + 1 WHERE id = property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION increment_property_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_contact_clicks(UUID) TO anon, authenticated;

-- Storage buckets (run in dashboard or separate migration)
-- property-media, agent-documents

-- ============================================
-- CREATE LEAD POOLS SYSTEM
-- ============================================
-- This adds the ability to organize contacts into pools/categories
-- and select which pool to use when creating campaigns

-- 1. Lead Pools Table
-- Stores named collections of contacts (e.g., "Q1 Sales Leads", "Enterprise Prospects")
CREATE TABLE IF NOT EXISTS cold_outreach_lead_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6', -- Hex color for UI display
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 2. Contact-to-Pool Junction Table
-- Many-to-many relationship: contacts can be in multiple pools
CREATE TABLE IF NOT EXISTS cold_outreach_contact_pools (
  contact_id uuid NOT NULL REFERENCES cold_outreach_contacts(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES cold_outreach_lead_pools(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  added_by uuid, -- Track who added the contact to this pool
  PRIMARY KEY (contact_id, pool_id)
);

-- 3. Add pool tracking to campaigns (optional: to track which pool was used)
ALTER TABLE cold_outreach_email_campaigns 
ADD COLUMN IF NOT EXISTS pool_ids uuid[] DEFAULT '{}'; -- Array of pool IDs used in this campaign

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS lead_pools_user_id_idx ON cold_outreach_lead_pools(user_id);
CREATE INDEX IF NOT EXISTS lead_pools_name_idx ON cold_outreach_lead_pools(user_id, name);
CREATE INDEX IF NOT EXISTS contact_pools_contact_id_idx ON cold_outreach_contact_pools(contact_id);
CREATE INDEX IF NOT EXISTS contact_pools_pool_id_idx ON cold_outreach_contact_pools(pool_id);
CREATE INDEX IF NOT EXISTS campaigns_pool_ids_idx ON cold_outreach_email_campaigns USING GIN(pool_ids);

-- 5. Enable Row Level Security
ALTER TABLE cold_outreach_lead_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_outreach_contact_pools ENABLE ROW LEVEL SECURITY;

-- 6. Create permissive policies (for development)
CREATE POLICY "allow_all_pools" ON cold_outreach_lead_pools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contact_pools" ON cold_outreach_contact_pools FOR ALL USING (true) WITH CHECK (true);

-- 7. Create helpful views
-- View to get contact count per pool
CREATE OR REPLACE VIEW cold_outreach_pool_stats AS
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.description,
  p.color,
  COUNT(cp.contact_id) as contact_count,
  p.created_at,
  p.updated_at
FROM cold_outreach_lead_pools p
LEFT JOIN cold_outreach_contact_pools cp ON p.id = cp.pool_id
GROUP BY p.id, p.user_id, p.name, p.description, p.color, p.created_at, p.updated_at;

-- View to get all pools for a contact
CREATE OR REPLACE VIEW cold_outreach_contact_pool_memberships AS
SELECT 
  c.id as contact_id,
  c.user_id,
  c.email,
  c.first_name,
  c.last_name,
  c.company,
  c.title,
  COALESCE(
    json_agg(
      json_build_object(
        'pool_id', p.id,
        'pool_name', p.name,
        'pool_color', p.color,
        'added_at', cp.added_at
      ) ORDER BY cp.added_at DESC
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'::json
  ) as pools
FROM cold_outreach_contacts c
LEFT JOIN cold_outreach_contact_pools cp ON c.id = cp.contact_id
LEFT JOIN cold_outreach_lead_pools p ON cp.pool_id = p.id
GROUP BY c.id, c.user_id, c.email, c.first_name, c.last_name, c.company, c.title;

-- 8. Create function to add contacts to pool in bulk
CREATE OR REPLACE FUNCTION add_contacts_to_pool(
  p_pool_id uuid,
  p_contact_ids uuid[]
) RETURNS integer AS $$
DECLARE
  inserted_count integer;
BEGIN
  INSERT INTO cold_outreach_contact_pools (contact_id, pool_id)
  SELECT unnest(p_contact_ids), p_pool_id
  ON CONFLICT (contact_id, pool_id) DO NOTHING;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to remove contacts from pool in bulk
CREATE OR REPLACE FUNCTION remove_contacts_from_pool(
  p_pool_id uuid,
  p_contact_ids uuid[]
) RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM cold_outreach_contact_pools
  WHERE pool_id = p_pool_id
  AND contact_id = ANY(p_contact_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to get contacts in pool(s)
CREATE OR REPLACE FUNCTION get_contacts_in_pools(
  p_user_id uuid,
  p_pool_ids uuid[]
) RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  company text,
  title text,
  industry text,
  notes text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id,
    c.email,
    c.first_name,
    c.last_name,
    c.company,
    c.title,
    c.industry,
    c.notes,
    c.created_at
  FROM cold_outreach_contacts c
  INNER JOIN cold_outreach_contact_pools cp ON c.id = cp.contact_id
  WHERE c.user_id = p_user_id
  AND cp.pool_id = ANY(p_pool_ids)
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 11. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pool_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_pools_updated_at
  BEFORE UPDATE ON cold_outreach_lead_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_pool_updated_at();

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- This is a non-breaking change that adds new functionality
-- Existing campaigns will continue to work (pool_ids will be empty array)
-- Contacts without pools can still be used in campaigns
-- To use pools: Create pools, assign contacts, then select pools during campaign creation

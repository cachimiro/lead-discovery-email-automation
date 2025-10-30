-- Fix the pool_stats view to return 'id' instead of 'pool_id'
-- Run this in Supabase SQL Editor

DROP VIEW IF EXISTS cold_outreach_pool_stats;

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

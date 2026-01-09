-- CCP-05 Monetization & Billing — Entitlement System Schema
-- Database migration: Entitlements (feature access) + Audit trail + Caching metadata
-- Migration number: 009

-- ============================================================================
-- 1. entitlements table (source of truth for feature access)
-- ============================================================================
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  tier TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reason_code TEXT, -- e.g., "TIER_INSUFFICIENT", "FEATURE_DISABLED", "GRACE_PERIOD_EXPIRED"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(workspace_id, feature),
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'pro', 'pro_plus', 'portfolio', 'enterprise')),
  CONSTRAINT valid_feature CHECK (feature ~ '^[a-z0-9_:/-]+$')
);

CREATE INDEX idx_entitlements_workspace_id ON entitlements(workspace_id);
CREATE INDEX idx_entitlements_workspace_feature ON entitlements(workspace_id, feature);
CREATE INDEX idx_entitlements_updated_at ON entitlements(updated_at DESC);

-- ============================================================================
-- 2. entitlement_checks table (append-only audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS entitlement_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  result BOOLEAN NOT NULL,
  reason_code TEXT,
  tier TEXT,
  cached BOOLEAN NOT NULL DEFAULT false,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_entitlement_checks_workspace_id ON entitlement_checks(workspace_id);
CREATE INDEX idx_entitlement_checks_user_id ON entitlement_checks(user_id);
CREATE INDEX idx_entitlement_checks_feature ON entitlement_checks(feature);
CREATE INDEX idx_entitlement_checks_created_at ON entitlement_checks(created_at DESC);
CREATE INDEX idx_entitlement_checks_workspace_created ON entitlement_checks(workspace_id, created_at DESC);

-- ============================================================================
-- 3. entitlement_cache table (track cache state, TTL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS entitlement_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Constraints
  UNIQUE(workspace_id, cache_key),
  CONSTRAINT valid_expiry CHECK (expires_at > cached_at)
);

CREATE INDEX idx_entitlement_cache_workspace_id ON entitlement_cache(workspace_id);
CREATE INDEX idx_entitlement_cache_expires_at ON entitlement_cache(expires_at);

-- Cleanup job: remove expired cache entries (optional, manual or cron)
-- DELETE FROM entitlement_cache WHERE expires_at < now();

-- ============================================================================
-- 4. billing_state table (Stripe sync status, webhook tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid', 'trial')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  last_webhook_event_id TEXT,
  last_webhook_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_tier CHECK (tier IN ('free', 'pro', 'pro_plus', 'portfolio', 'enterprise'))
);

CREATE INDEX idx_billing_state_workspace_id ON billing_state(workspace_id);
CREATE INDEX idx_billing_state_stripe_customer_id ON billing_state(stripe_customer_id);
CREATE INDEX idx_billing_state_stripe_subscription_id ON billing_state(stripe_subscription_id);
CREATE INDEX idx_billing_state_tier ON billing_state(tier);
CREATE INDEX idx_billing_state_updated_at ON billing_state(updated_at DESC);

-- ============================================================================
-- 5. Row-Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlement_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_state ENABLE ROW LEVEL SECURITY;

-- entitlements: users can only view/modify entitlements for their workspace
CREATE POLICY entitlements_select ON entitlements
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY entitlements_insert ON entitlements
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY entitlements_update ON entitlements
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- entitlement_checks: audit trail, no DELETE allowed (append-only)
CREATE POLICY entitlement_checks_select ON entitlement_checks
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY entitlement_checks_insert ON entitlement_checks
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- entitlement_cache: users can view cache state for their workspace
CREATE POLICY entitlement_cache_select ON entitlement_cache
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- billing_state: users can view but not modify (admin only)
CREATE POLICY billing_state_select ON billing_state
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. Default Entitlements (per tier)
-- ============================================================================

-- Helper function to initialize entitlements for a workspace when created
-- (Called by trigger when new workspace inserted, or manually)
CREATE OR REPLACE FUNCTION init_workspace_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  -- Define default features per tier
  INSERT INTO entitlements (workspace_id, feature, tier, enabled, reason_code)
  VALUES
    (NEW.id, 'ccp-01:parcel-discovery', 'free', true, NULL),
    (NEW.id, 'ccp-02:parcel-context', 'free', true, NULL),
    (NEW.id, 'ccp-03:report-generation', 'free', true, NULL),
    (NEW.id, 'ccp-04:report-viewing', 'free', true, NULL),
    (NEW.id, 'ccp-05:billing', 'free', true, NULL),
    (NEW.id, 'ccp-06:branded-reports', 'pro', false, 'TIER_INSUFFICIENT'),
    (NEW.id, 'ccp-07:audit-logging', 'free', true, NULL),
    (NEW.id, 'ccp-08:saved-parcels', 'pro', false, 'TIER_INSUFFICIENT'),
    (NEW.id, 'ccp-09:contact-upload', 'pro_plus', false, 'TIER_INSUFFICIENT'),
    (NEW.id, 'ccp-10:collaboration', 'portfolio', false, 'TIER_INSUFFICIENT'),
    (NEW.id, 'ccp-11:events', 'pro_plus', false, 'TIER_INSUFFICIENT'),
    (NEW.id, 'ccp-12:sharing', 'free', true, NULL),
    (NEW.id, 'ccp-14:premium-features', 'pro', false, 'TIER_INSUFFICIENT'),
    (NEW.id, 'ccp-15:export', 'portfolio', false, 'TIER_INSUFFICIENT')
  ON CONFLICT (workspace_id, feature) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-initialize entitlements on workspace creation
CREATE TRIGGER workspace_entitlements_init
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION init_workspace_entitlements();

-- ============================================================================
-- 7. Sync Trigger (update billing_state when subscription changes)
-- ============================================================================

-- Function to sync entitlements from billing_state tier
CREATE OR REPLACE FUNCTION sync_entitlements_from_billing()
RETURNS TRIGGER AS $$
BEGIN
  -- When billing_state.tier changes, update entitlements to match new tier
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    -- Update all entitlements for this workspace to reflect new tier
    UPDATE entitlements
    SET
      enabled = (tier <= NEW.tier), -- Feature enabled if its tier requirement <= user's tier
      reason_code = CASE
        WHEN tier <= NEW.tier THEN NULL
        ELSE 'TIER_INSUFFICIENT'
      END,
      updated_at = now()
    WHERE workspace_id = NEW.workspace_id;
    
    -- Invalidate cache for this workspace
    DELETE FROM entitlement_cache WHERE workspace_id = NEW.workspace_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_state_entitlements_sync
  AFTER UPDATE ON billing_state
  FOR EACH ROW
  EXECUTE FUNCTION sync_entitlements_from_billing();

-- ============================================================================
-- 8. Utility Views
-- ============================================================================

-- View: Current entitlements status for workspace
CREATE OR REPLACE VIEW entitlements_current AS
SELECT
  workspace_id,
  feature,
  tier,
  enabled,
  reason_code,
  updated_at
FROM entitlements
WHERE enabled = true
ORDER BY workspace_id, feature;

-- View: Entitlement check summary (last 30 days)
CREATE OR REPLACE VIEW entitlement_checks_summary AS
SELECT
  workspace_id,
  feature,
  COUNT(*) as check_count,
  SUM(CASE WHEN result = true THEN 1 ELSE 0 END) as allowed_count,
  SUM(CASE WHEN result = false THEN 1 ELSE 0 END) as denied_count,
  SUM(CASE WHEN cached = true THEN 1 ELSE 0 END) as cached_count,
  (SUM(CASE WHEN cached = true THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100)::INT as cache_hit_rate_pct
FROM entitlement_checks
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY workspace_id, feature
ORDER BY workspace_id, check_count DESC;

-- View: Billing status by workspace
CREATE OR REPLACE VIEW billing_status_current AS
SELECT
  b.workspace_id,
  b.tier,
  b.status,
  b.current_period_end,
  b.trial_end,
  CASE
    WHEN b.status = 'trial' AND b.trial_end > now() THEN 'Active Trial'
    WHEN b.status = 'active' AND b.current_period_end > now() THEN 'Active Subscription'
    WHEN b.status = 'past_due' THEN 'Past Due'
    WHEN b.status = 'cancelled' THEN 'Cancelled'
    ELSE 'Unknown'
  END as billing_status_display,
  b.synced_at,
  EXTRACT(DAY FROM (b.current_period_end - now()))::INT as days_until_renewal
FROM billing_state b;

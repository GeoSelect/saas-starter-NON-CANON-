/**
 * Database Migration: Feature Gating Tables (C046)
 * PostgreSQL/MySQL schema for feature entitlements and usage tracking
 */

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Feature gating tables
CREATE TABLE IF NOT EXISTS features (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  min_plan_required VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_feature_id (id),
  INDEX idx_category (category),
  INDEX idx_min_plan (min_plan_required)
);

-- Plan definitions
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_period ENUM('monthly', 'annual') DEFAULT 'monthly',
  user_limit INT DEFAULT 1,
  storage_gb INT DEFAULT 1,
  api_calls_per_month INT DEFAULT 0,
  support_level ENUM('community', 'email', 'priority', 'dedicated') DEFAULT 'community',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_plan_id (id),
  INDEX idx_price (price)
);

-- Feature matrix: which features are available in each plan
CREATE TABLE IF NOT EXISTS plan_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plan_id VARCHAR(50) NOT NULL,
  feature_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_plan_feature (plan_id, feature_id),
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  INDEX idx_plan_id (plan_id),
  INDEX idx_feature_id (feature_id)
);

-- User feature entitlements
CREATE TABLE IF NOT EXISTS user_feature_entitlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  feature_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_feature (user_id, feature_id),
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_feature_id (feature_id),
  INDEX idx_plan_id (plan_id),
  INDEX idx_expires_at (expires_at)
);

-- Feature usage tracking
CREATE TABLE IF NOT EXISTS feature_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  feature_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  usage_count INT DEFAULT 1,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_feature_id (feature_id),
  INDEX idx_created_at (created_at)
);

-- Feature access logs
CREATE TABLE IF NOT EXISTS feature_access_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  feature_id VARCHAR(255) NOT NULL,
  access_granted BOOLEAN NOT NULL,
  reason VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (feature_id) REFERENCES features(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_feature_id (feature_id),
  INDEX idx_access_granted (access_granted),
  INDEX idx_created_at (created_at)
);

-- Views

-- View: User feature access status
CREATE OR REPLACE VIEW v_user_feature_access AS
SELECT 
  ufe.user_id,
  ufe.feature_id,
  f.name AS feature_name,
  f.category,
  ufe.plan_id,
  sp.display_name AS plan_name,
  ufe.expires_at,
  CASE 
    WHEN ufe.revoked_at IS NOT NULL THEN 'revoked'
    WHEN ufe.expires_at IS NOT NULL AND ufe.expires_at < NOW() THEN 'expired'
    ELSE 'active'
  END AS status
FROM user_feature_entitlements ufe
JOIN features f ON ufe.feature_id = f.id
JOIN subscription_plans sp ON ufe.plan_id = sp.id;

-- View: Feature usage summary
CREATE OR REPLACE VIEW v_feature_usage_summary AS
SELECT 
  feature_id,
  f.name AS feature_name,
  COUNT(DISTINCT user_id) AS unique_users,
  SUM(usage_count) AS total_usage,
  MAX(created_at) AS last_used
FROM feature_usage fu
JOIN features f ON fu.feature_id = f.id
GROUP BY feature_id, f.name;

-- View: Plan feature matrix
CREATE OR REPLACE VIEW v_plan_features AS
SELECT 
  sp.id AS plan_id,
  sp.display_name AS plan_name,
  sp.price,
  f.id AS feature_id,
  f.name AS feature_name,
  f.category
FROM subscription_plans sp
LEFT JOIN plan_features pf ON sp.id = pf.plan_id
LEFT JOIN features f ON pf.feature_id = f.id
ORDER BY sp.price, f.category, f.name;

-- Stored Procedures

-- Procedure: Grant feature to user
DELIMITER //
CREATE PROCEDURE sp_grant_feature_to_user(
  IN p_user_id VARCHAR(255),
  IN p_feature_id VARCHAR(255),
  IN p_plan_id VARCHAR(50),
  IN p_expires_at TIMESTAMP
)
BEGIN
  INSERT INTO user_feature_entitlements (user_id, feature_id, plan_id, expires_at)
  VALUES (p_user_id, p_feature_id, p_plan_id, p_expires_at)
  ON DUPLICATE KEY UPDATE 
    revoked_at = NULL,
    expires_at = p_expires_at,
    updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Procedure: Revoke feature from user
DELIMITER //
CREATE PROCEDURE sp_revoke_feature_from_user(
  IN p_user_id VARCHAR(255),
  IN p_feature_id VARCHAR(255)
)
BEGIN
  UPDATE user_feature_entitlements
  SET revoked_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND feature_id = p_feature_id;
END//
DELIMITER ;

-- Procedure: Grant all plan features to user
DELIMITER //
CREATE PROCEDURE sp_grant_plan_features(
  IN p_user_id VARCHAR(255),
  IN p_plan_id VARCHAR(50)
)
BEGIN
  INSERT INTO user_feature_entitlements (user_id, feature_id, plan_id)
  SELECT p_user_id, feature_id, p_plan_id
  FROM plan_features
  WHERE plan_id = p_plan_id
  ON DUPLICATE KEY UPDATE 
    revoked_at = NULL,
    plan_id = p_plan_id,
    updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Demo Data Insertion

-- Insert features
INSERT INTO features (id, name, description, category, min_plan_required) VALUES
('basic-search', 'Basic Search', 'Search properties by location and basic filters', 'search', 'browse'),
('advanced-search', 'Advanced Search Filters', 'Complex queries with multiple criteria and saved filters', 'search', 'studio'),
('map-view', 'Map View', 'Interactive map visualization of search results', 'search', 'home'),
('saved-searches', 'Saved Searches', 'Save and organize your searches for quick access', 'search', 'home'),
('property-comparison', 'Property Comparison', 'Compare multiple properties side-by-side', 'analysis', 'studio'),
('market-analysis', 'Market Analysis', 'Detailed market trends and neighborhood analytics', 'analysis', 'pro-workspace'),
('ai-insights', 'AI-Powered Insights', 'AI-generated investment recommendations and market predictions', 'analysis', 'pro-ai'),
('crm-contacts', 'Contact Management', 'Organize and manage client and prospect contacts', 'crm', 'pro-crm'),
('crm-pipeline', 'Sales Pipeline', 'Track deals through customizable pipeline stages', 'crm', 'pro-crm'),
('crm-automation', 'Workflow Automation', 'Automate tasks, reminders, and follow-ups', 'crm', 'pro-crm'),
('data-export', 'Data Export', 'Export data to CSV, Excel, and PDF formats', 'reporting', 'studio'),
('custom-reports', 'Custom Reports', 'Create branded, customizable reports', 'reporting', 'pro-workspace'),
('api-access', 'API Access', 'Full API access for integrations and automation', 'integration', 'pro-ai'),
('team-collaboration', 'Team Collaboration', 'Share workspaces, assign tasks, and collaborate with team members', 'admin', 'pro-workspace'),
('white-label', 'White Label', 'Customize branding and domain for client-facing tools', 'admin', 'portfolio'),
('audit-trail', 'Audit Trail', 'View complete activity logs and user actions', 'admin', 'pro-workspace');

-- Insert plans
INSERT INTO subscription_plans (id, name, display_name, description, price, billing_period, user_limit, storage_gb, api_calls_per_month, support_level, featured) VALUES
('browse', 'Browse', 'Browse', 'Get started with basic property search', 0, 'monthly', 1, 1, 0, 'community', FALSE),
('home', 'Home', 'Home', 'Perfect for homebuyers and sellers', 29, 'monthly', 2, 10, 1000, 'email', FALSE),
('studio', 'Studio', 'Studio', 'For individual real estate professionals', 79, 'monthly', 1, 50, 10000, 'email', FALSE),
('pro-workspace', 'Pro + Workspace', 'Pro + Workspace', 'Team collaboration and advanced analytics', 199, 'monthly', 10, 500, 100000, 'priority', TRUE),
('pro-crm', 'Pro + CRM', 'Pro + CRM', 'Full CRM suite for managing deals and clients', 249, 'monthly', 10, 500, 100000, 'priority', FALSE),
('pro-ai', 'Pro + AI', 'Pro + AI', 'AI-powered insights and API access', 349, 'monthly', 10, 500, 500000, 'priority', FALSE),
('portfolio', 'Portfolio', 'Portfolio', 'Enterprise solution with white-label and dedicated support', 999, 'monthly', 100, 5000, 1000000, 'dedicated', FALSE);

-- Insert plan features
INSERT INTO plan_features (plan_id, feature_id) VALUES
-- Browse plan
('browse', 'basic-search'),
-- Home plan
('home', 'basic-search'),
('home', 'map-view'),
('home', 'saved-searches'),
-- Studio plan
('studio', 'basic-search'),
('studio', 'map-view'),
('studio', 'saved-searches'),
('studio', 'advanced-search'),
('studio', 'property-comparison'),
('studio', 'data-export'),
-- Pro + Workspace
('pro-workspace', 'basic-search'),
('pro-workspace', 'map-view'),
('pro-workspace', 'saved-searches'),
('pro-workspace', 'advanced-search'),
('pro-workspace', 'property-comparison'),
('pro-workspace', 'data-export'),
('pro-workspace', 'market-analysis'),
('pro-workspace', 'custom-reports'),
('pro-workspace', 'team-collaboration'),
('pro-workspace', 'audit-trail'),
-- Pro + CRM
('pro-crm', 'basic-search'),
('pro-crm', 'map-view'),
('pro-crm', 'saved-searches'),
('pro-crm', 'advanced-search'),
('pro-crm', 'property-comparison'),
('pro-crm', 'data-export'),
('pro-crm', 'market-analysis'),
('pro-crm', 'custom-reports'),
('pro-crm', 'crm-contacts'),
('pro-crm', 'crm-pipeline'),
('pro-crm', 'crm-automation'),
-- Pro + AI
('pro-ai', 'basic-search'),
('pro-ai', 'map-view'),
('pro-ai', 'saved-searches'),
('pro-ai', 'advanced-search'),
('pro-ai', 'property-comparison'),
('pro-ai', 'data-export'),
('pro-ai', 'market-analysis'),
('pro-ai', 'custom-reports'),
('pro-ai', 'crm-contacts'),
('pro-ai', 'crm-pipeline'),
('pro-ai', 'crm-automation'),
('pro-ai', 'ai-insights'),
('pro-ai', 'api-access'),
-- Portfolio
('portfolio', 'basic-search'),
('portfolio', 'map-view'),
('portfolio', 'saved-searches'),
('portfolio', 'advanced-search'),
('portfolio', 'property-comparison'),
('portfolio', 'data-export'),
('portfolio', 'market-analysis'),
('portfolio', 'custom-reports'),
('portfolio', 'crm-contacts'),
('portfolio', 'crm-pipeline'),
('portfolio', 'crm-automation'),
('portfolio', 'ai-insights'),
('portfolio', 'api-access'),
('portfolio', 'team-collaboration'),
('portfolio', 'white-label'),
('portfolio', 'audit-trail');

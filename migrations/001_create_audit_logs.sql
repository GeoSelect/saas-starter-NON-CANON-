-- Audit Logs Table Migration
-- Creates table for tracking user activity, logins, and changes

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  plan VARCHAR(100),
  action VARCHAR(50) NOT NULL CHECK (action IN ('login', 'logout', 'signup', 'plan_change', 'data_export', 'data_import')),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date DATE NOT NULL,
  time TIME NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure')),
  details TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for common queries
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_action (action),
  INDEX idx_status (status),
  INDEX idx_date (date),
  INDEX idx_user_email (user_email)
);

-- Create view for daily login activity summary
CREATE OR REPLACE VIEW audit_daily_logins AS
SELECT 
  DATE(timestamp) as login_date,
  COUNT(*) as total_logins,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_logins,
  COUNT(CASE WHEN status = 'failure' THEN 1 END) as failed_logins,
  COUNT(DISTINCT user_id) as unique_users
FROM audit_logs
WHERE action = 'login'
GROUP BY DATE(timestamp)
ORDER BY login_date DESC;

-- Create view for user login history
CREATE OR REPLACE VIEW audit_user_logins AS
SELECT 
  user_id,
  user_name,
  user_email,
  plan,
  COUNT(*) as total_logins,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_logins,
  MAX(timestamp) as last_login
FROM audit_logs
WHERE action = 'login'
GROUP BY user_id, user_name, user_email, plan
ORDER BY last_login DESC;

-- Create view for failed login attempts
CREATE OR REPLACE VIEW audit_failed_logins AS
SELECT 
  user_email,
  COUNT(*) as failed_attempts,
  MAX(timestamp) as last_failed_attempt,
  GROUP_CONCAT(DISTINCT ip_address) as attempted_from_ips
FROM audit_logs
WHERE action = 'login' AND status = 'failure'
GROUP BY user_email
ORDER BY failed_attempts DESC;

-- Optional: Create procedure to clean up old audit logs (keep last 1 year)
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS sp_cleanup_audit_logs()
BEGIN
  DELETE FROM audit_logs 
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
END$$
DELIMITER ;

-- Optional: Create scheduled event to run cleanup weekly (if using MySQL)
-- CREATE EVENT IF NOT EXISTS event_cleanup_audit_logs
-- ON SCHEDULE EVERY 1 WEEK
-- DO CALL sp_cleanup_audit_logs();

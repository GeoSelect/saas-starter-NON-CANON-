-- Create seed user and team for development
-- This ensures the mock user ID=1 and team ID=1 exist in the database

-- Insert seed user if not exists
INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
VALUES (1, 'John Developer', 'john@example.com', '$2a$10$dummy', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Ensure the sequence is updated
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insert seed team if not exists
INSERT INTO teams (id, name, created_at, updated_at)
VALUES (1, 'Acme Real Estate', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Ensure the sequence is updated
SELECT setval('teams_id_seq', (SELECT MAX(id) FROM teams));

-- Add user to team if not exists
INSERT INTO team_members (user_id, team_id, role, joined_at)
VALUES (1, 1, 'admin', NOW())
ON CONFLICT (user_id, team_id) DO NOTHING;

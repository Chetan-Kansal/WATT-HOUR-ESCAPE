-- Migration: Add Admin Role to Teams
-- Adds a 'role' column to the teams table to distinguish between regular teams and administrators.

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'team' CHECK (role IN ('team', 'admin'));

-- Update existing admin user if email matches ADMIN_EMAIL (optional but helpful)
-- UPDATE teams SET role = 'admin' WHERE email = 'admin@gdgieee.com';

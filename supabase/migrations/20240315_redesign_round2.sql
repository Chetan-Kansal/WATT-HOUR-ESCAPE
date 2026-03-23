-- Migration: Redesign Round 2 - Sequential Debugging
-- Add tracking columns for sequential progress and per-problem attempts

ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS round2_problem_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS round2_attempts JSONB DEFAULT '{}';

-- Optional: Initialize round2_attempts for existing rows if needed
-- UPDATE progress SET round2_attempts = '{}' WHERE round2_attempts IS NULL;

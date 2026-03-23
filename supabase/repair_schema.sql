-- ============================================================
-- REPAIR SCRIPT: Missing Columns and RPCs
-- ============================================================

-- 1. Add total_time to teams (Critical for leaderboard)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS total_time INT;

-- 2. Ensure ALL Round columns in progress (Expansion to 10 rounds)
ALTER TABLE progress 
ADD COLUMN IF NOT EXISTS round2_problem_index INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS round2_attempts JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS round6_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round7_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round8_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round9_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round10_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS round6_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round7_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round8_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round9_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS round10_time TIMESTAMPTZ;

-- 3. Server Time RPC
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Re-create Leaderboard View (ensure it picks up new total_time)
DROP VIEW IF EXISTS leaderboard;
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  t.id,
  t.team_name,
  t.current_round,
  t.status,
  t.start_time,
  t.end_time,
  t.total_time,
  t.role,
  t.created_at,
  RANK() OVER (
    ORDER BY
      CASE WHEN t.status = 'completed' THEN 0 ELSE 1 END,
      t.total_time ASC NULLS LAST,
      t.current_round DESC
  ) AS rank
FROM teams t
WHERE t.status IN ('active', 'completed') AND t.role = 'team' -- Exclude admins from leaderboard
ORDER BY rank;

-- 5. Force Schema Cache Reload (Critical for PostgREST)
NOTIFY pgrst, 'reload schema';

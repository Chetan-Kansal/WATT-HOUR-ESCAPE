-- ============================================================
-- GDG × IEEE PES Competition Platform — Supabase SQL Schema
-- ============================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  current_round INT NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','active','completed','disqualified')),
  role TEXT NOT NULL DEFAULT 'team' CHECK (role IN ('team','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_total_time ON teams(total_time ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_teams_current_round ON teams(current_round DESC);

-- ============================================================
-- PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  round1_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round2_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round3_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round4_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round5_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round6_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round7_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round8_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round9_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round10_completed BOOLEAN NOT NULL DEFAULT FALSE,
  round1_time TIMESTAMPTZ,
  round2_time TIMESTAMPTZ,
  round3_time TIMESTAMPTZ,
  round4_time TIMESTAMPTZ,
  round5_time TIMESTAMPTZ,
  round6_time TIMESTAMPTZ,
  round7_time TIMESTAMPTZ,
  round8_time TIMESTAMPTZ,
  round9_time TIMESTAMPTZ,
  round10_time TIMESTAMPTZ,
  quiz_streak INT NOT NULL DEFAULT 0,
  quiz_questions_seen UUID[] NOT NULL DEFAULT '{}',
  debug_attempts INT NOT NULL DEFAULT 0,
  round2_problem_index INT NOT NULL DEFAULT 0,
  round2_attempts JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_team ON progress(team_id);

-- ============================================================
-- QUIZ QUESTIONS (Round 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  category TEXT NOT NULL CHECK (category IN ('programming','cs_fundamentals','energy_systems','logic')),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEBUG PROBLEMS (Round 2)
-- ============================================================
CREATE TABLE IF NOT EXISTS debug_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  problem_text TEXT NOT NULL,
  code_snippet TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'python' CHECK (language IN ('python','javascript','cpp','java')),
  expected_output TEXT NOT NULL,
  test_cases JSONB NOT NULL DEFAULT '[]',
  judge0_language_id INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CIRCUIT PROBLEMS (Round 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS circuit_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  diagram_options JSONB NOT NULL,   -- [{id, label, image_url, description}]
  correct_option TEXT NOT NULL,     -- matches id in diagram_options
  explanation TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- IMAGE ROUND (Round 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS image_round (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Reverse Prompt Challenge',
  image_url TEXT NOT NULL,
  prompt_hidden TEXT NOT NULL,      -- NEVER exposed to clients
  similarity_threshold FLOAT NOT NULL DEFAULT 0.80,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MORSE DATA (Round 5)
-- ============================================================
CREATE TABLE IF NOT EXISTS morse_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audio_url TEXT NOT NULL,
  word TEXT NOT NULL,
  morse_code TEXT NOT NULL,
  is_final_key BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBMISSION LOG (Anti-cheat rate limiting)
-- ============================================================
CREATE TABLE IF NOT EXISTS submission_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round INT NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, round)
);

CREATE INDEX IF NOT EXISTS idx_submission_log_team ON submission_log(team_id, round);

-- ============================================================
-- SUBMISSION AUDITS (Individual submisssion record)
-- ============================================================
CREATE TABLE IF NOT EXISTS submission_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round INT NOT NULL,
  result TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_submission_logs_team ON submission_logs(team_id, round);

-- ============================================================
-- IP LOG (Anti-cheat audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS ip_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_log_team ON ip_log(team_id);
CREATE INDEX IF NOT EXISTS idx_ip_log_ip ON ip_log(ip_address);

-- ============================================================
-- LEADERBOARD VIEW (window ranked)
-- ============================================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  t.id,
  t.team_name,
  t.current_round,
  t.status,
  t.start_time,
  t.end_time,
  t.total_time,
  t.created_at,
  RANK() OVER (
    ORDER BY
      CASE WHEN t.status = 'completed' THEN 0 ELSE 1 END,
      t.total_time ASC NULLS LAST,
      t.current_round DESC
  ) AS rank
FROM teams t
WHERE t.status IN ('active', 'completed')
ORDER BY rank;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debug_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_round ENABLE ROW LEVEL SECURITY;
ALTER TABLE morse_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_log ENABLE ROW LEVEL SECURITY;

-- Teams: can read own row only
DROP POLICY IF EXISTS "teams_read_own" ON teams;
CREATE POLICY "teams_read_own" ON teams
  FOR SELECT USING (auth.uid()::text = id::text);

-- Service role bypasses all RLS (used by API routes with service key)
-- Note: Supabase service_role key bypasses RLS automatically.

-- Quiz questions: readable by authenticated users (no correct_option via RLS column filter)
DROP POLICY IF EXISTS "quiz_read_authenticated" ON quiz_questions;
CREATE POLICY "quiz_read_authenticated" ON quiz_questions
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Circuit, debug, image, morse: authenticated read
DROP POLICY IF EXISTS "circuit_read_auth" ON circuit_problems;
CREATE POLICY "circuit_read_auth" ON circuit_problems
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

DROP POLICY IF EXISTS "debug_read_auth" ON debug_problems;
CREATE POLICY "debug_read_auth" ON debug_problems
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

DROP POLICY IF EXISTS "image_read_auth" ON image_round;
CREATE POLICY "image_read_auth" ON image_round
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

DROP POLICY IF EXISTS "morse_read_auth" ON morse_data;
CREATE POLICY "morse_read_auth" ON morse_data
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Progress: own row only
DROP POLICY IF EXISTS "progress_own" ON progress;
CREATE POLICY "progress_own" ON progress
  FOR ALL USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = progress.team_id AND auth.uid()::text = teams.id::text)
  );

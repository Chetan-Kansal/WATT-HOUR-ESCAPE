const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const envPath = path.resolve(__dirname, '../.env.local');
  let supabaseUrl = '';
  
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envLines = envFile.split('\n');
    for (const line of envLines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1].trim();
      }
    }
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
    process.exit(1);
  }

  console.log("To create the submission_logs tracking table, please run this specific SQL snippet in your Supabase SQL Editor:");
  console.log(`
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
ALTER TABLE submission_logs ENABLE ROW LEVEL SECURITY;
  `);

}

runMigration();

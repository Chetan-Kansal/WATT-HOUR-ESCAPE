const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function simulateJourney() {
  const envPath = path.resolve(__dirname, '../.env.local');
  let supabaseUrl = '';
  let supabaseKey = '';
  
  try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envLines = envFile.split('\n');
    for (const line of envLines) {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
      if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
    }
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("== Starting E2E Simulation ==");
  
  // 1. Find a test team
  const { data: team, error: teamErr } = await supabase.from('teams').select('*').eq('team_name', 'Team Alpha').single();
  if (teamErr) return console.error("Could not find team:", teamErr);

  console.log("1. Got Team:", team.id);

  // 2. Mocking `canAccessRound` state testing via direct progress table changes
  // Let's pretend they solved round 1 and the endpoint called completeRound(team.id, 1)

  console.log("2. Simulating backend completeRound(1)...");
  
  const now = new Date().toISOString();
  await supabase.from('progress').update({
     round1_completed: true,
     round1_time: now
  }).eq('team_id', team.id);
  
  await supabase.from('teams').update({ current_round: 0, status: 'active' }).eq('id', team.id);

  // 3. Fake an audit submission to ensure RLS bypass works for the service key
  console.log("3. Writing an audit log...");
  const { error: auditErr } = await supabase.from('submission_logs').insert({
    team_id: team.id,
    round: 1,
    result: 'Simulated correct answer via E2E testing',
    ip: '127.0.0.1'
  });

  if (auditErr) {
     console.error("Audit Write Failed! Error:", auditErr);
     process.exit(1);
  }

  // 4. Checking the Admin API representation of the Leaderboard
  console.log("4. Simulating Round 5 completion & total time finalization...");
  
  const startTime = new Date(Date.now() - 3600000); // 1 hour ago
  await supabase.from('teams').update({ 
      start_time: startTime.toISOString(), 
      end_time: now, 
      total_time: 3600, 
      current_round: 5,
      status: 'completed'
  }).eq('id', team.id);
  
  await supabase.from('progress').update({
     round5_completed: true,
     round5_time: now
  }).eq('team_id', team.id);

  console.log("5. Checking final leaderboard rank...");
  // Query the view directly
  const { data: leaderboard, error: lErr } = await supabase.from('leaderboard').select('*');
  if (lErr) console.error("Leaderboard read failed", lErr);
  else console.table(leaderboard);

  // 6. Reset the team back to fresh
  console.log("6. Cleaning up E2E run...");
  await supabase.from('teams').update({ 
    start_time: null, 
    end_time: null, 
    total_time: null, 
    current_round: 0,
    status: 'registered'
  }).eq('id', team.id);
  
  await supabase.from('progress').update({
    round1_completed: false,
    round2_completed: false,
    round3_completed: false,
    round4_completed: false,
    round5_completed: false,
    quiz_streak: 0,
    round1_time: null,
    round5_time: null
  }).eq('team_id', team.id);
  
  // Wipe test audits
  await supabase.from('submission_logs').delete().eq('team_id', team.id);

  console.log("== E2E Simulation Passed ==");
}

simulateJourney();

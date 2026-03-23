
import { createSupabaseAdmin } from './lib/supabase/server.js'

async function debug() {
    const admin = createSupabaseAdmin()
    const { data: { users } } = await admin.auth.admin.listUsers()
    
    console.log("--- TEAMS ---")
    const { data: teams } = await admin.from('teams').select('*')
    console.log(JSON.stringify(teams, null, 2))
    
    console.log("--- PROGRESS ---")
    const { data: progress } = await admin.from('progress').select('*')
    console.log(JSON.stringify(progress, null, 2))
}

debug()

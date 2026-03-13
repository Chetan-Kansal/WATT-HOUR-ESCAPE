import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase/server'
import type { Team, Progress } from '@/types/database'

// ── Get current authenticated team ──────────────────────────────────────────
export async function getAuthenticatedTeam(): Promise<Team | null> {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const admin = createSupabaseAdmin()
    const { data: team } = await admin
        .from('teams')
        .select('*')
        .eq('id', user.id)
        .single()

    return (team as Team | null)
}

// ── Get team progress ────────────────────────────────────────────────────────
export async function getTeamProgress(teamId: string): Promise<Progress | null> {
    const admin = createSupabaseAdmin()
    const { data } = await admin
        .from('progress')
        .select('*')
        .eq('team_id', teamId)
        .single()
    return (data as Progress | null)
}

// ── Verify JWT from request headers ─────────────────────────────────────────
export async function verifyTeamFromRequest(req: Request): Promise<Team | null> {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null

    const token = authHeader.slice(7)
    const admin = createSupabaseAdmin()
    const { data: { user }, error } = await admin.auth.getUser(token)
    if (error || !user) return null

    const { data: team } = await admin
        .from('teams')
        .select('*')
        .eq('id', user.id)
        .single()

    return (team as Team | null)
}

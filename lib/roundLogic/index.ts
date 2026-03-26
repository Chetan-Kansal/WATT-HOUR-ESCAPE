import { createSupabaseAdmin } from '@/lib/supabase/server'

// ── Check if a team can access a given round ─────────────────────────────────
export async function canAccessRound(teamId: string, round: number): Promise<boolean> {
    const admin = createSupabaseAdmin()
    const { data: team } = await admin
        .from('teams')
        .select('current_round, status, start_time, role')
        .eq('id', teamId)
        .single()

    if (!team) return false
    if (team.role === 'admin') return true // Master Admin Bypass

    if (round === 1) return true // Round 1 always accessible after event starts

    if (!team.start_time || team.status === 'registered') return false
    if (team.status === 'disqualified') return false

    // To access Round N, must have completed Round N-1 in the progress table
    const { data: progress } = await admin
        .from('progress')
        .select('*')
        .eq('team_id', teamId)
        .single()
    
    if (!progress) return false

    const prevRoundField = `round${round - 1}_completed` as keyof typeof progress
    return !!progress[prevRoundField]
}

// ── Mark a round as completed and unlock next ────────────────────────────────
export async function completeRound(teamId: string, round: number): Promise<void> {
    const admin = createSupabaseAdmin()
    const now = new Date().toISOString()

    const roundTimeField = `round${round}_time` as
        'round1_time' | 'round2_time' | 'round3_time' | 'round4_time' | 'round5_time' | 'round6_time' | 'round7_time' | 'round8_time' | 'round9_time' | 'round10_time'
    const roundCompletedField = `round${round}_completed` as
        'round1_completed' | 'round2_completed' | 'round3_completed' | 'round4_completed' | 'round5_completed' | 'round6_completed' | 'round7_completed' | 'round8_completed' | 'round9_completed' | 'round10_completed'

    // Update progress table
    await admin
        .from('progress')
        .update({
            [roundCompletedField]: true,
            [roundTimeField]: now,
            updated_at: now,
        } as never)
        .eq('team_id', teamId)

    // Update team current_round
    await admin
        .from('teams')
        .update({ current_round: round } as never)
        .eq('id', teamId)
        .lt('current_round', round) // Only update if not already higher
}

// ── Log submission attempt (rate limiting) ────────────────────────────────────
export async function logSubmissionAttempt(
    teamId: string,
    round: number
): Promise<{ count: number; blocked: boolean; reason?: 'cooldown' | 'limit'; remaining?: number }> {
    const admin = createSupabaseAdmin()

    // Fetch team to check role (Admins have no limits)
    const { data: team } = await admin
        .from('teams')
        .select('role')
        .eq('id', teamId)
        .single()

    if (team?.role === 'admin') {
        return { count: 0, blocked: false }
    }

    const { data: existing } = await admin
        .from('submission_log')
        .select('attempt_count, last_attempt_at')
        .eq('team_id', teamId)
        .eq('round', round)
        .single()

    const MAX_ATTEMPTS = round === 1 ? 50 : round === 2 ? 15 : 20
    const COOLDOWN_SECONDS = 10

    if (existing) {
        const lastAttempt = new Date(existing.last_attempt_at)
        const secondsSinceLastAttempt = (Date.now() - lastAttempt.getTime()) / 1000

        if (secondsSinceLastAttempt < COOLDOWN_SECONDS) {
            return { 
                count: existing.attempt_count, 
                blocked: true, 
                reason: 'cooldown',
                remaining: Math.ceil(COOLDOWN_SECONDS - secondsSinceLastAttempt)
            }
        }

        const newCount = existing.attempt_count + 1
        if (newCount > MAX_ATTEMPTS) {
            return { count: existing.attempt_count, blocked: true, reason: 'limit' }
        }

        await admin
            .from('submission_log')
            .update({ attempt_count: newCount, last_attempt_at: new Date().toISOString() } as never)
            .eq('team_id', teamId)
            .eq('round', round)

        return { count: newCount, blocked: false }
    }

    // First attempt
    await admin
        .from('submission_log')
        .insert({ team_id: teamId, round, attempt_count: 1 } as never)

    return { count: 1, blocked: false }
}

// ── Log IP address for anti-cheat ─────────────────────────────────────────────
export async function logIPAddress(
    teamId: string | null,
    ip: string,
    endpoint: string,
    method = 'POST'
): Promise<void> {
    try {
        const admin = createSupabaseAdmin()
        await admin.from('ip_log').insert({
            team_id: teamId,
            ip_address: ip,
            endpoint,
            method,
        } as never)
    } catch {
        // Non-fatal — never crash on logging
    }
}

// ── Log Individual Submission Audit ──────────────────────────────────────────
export async function logAuditSubmission(
    teamId: string,
    round: number,
    result: string,
    ip: string
): Promise<void> {
    try {
        const admin = createSupabaseAdmin()
        await admin.from('submission_logs').insert({
            team_id: teamId,
            round,
            result,
            ip,
        } as never)
    } catch (e) {
        console.error("Failed to log submission audit", e)
    }
}

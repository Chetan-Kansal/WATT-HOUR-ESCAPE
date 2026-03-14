import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const admin = createSupabaseAdmin()

        // 1. Get Learboard / Team Times
        const { data: leaderboard, error: lErr } = await admin
            .from('leaderboard' as never)
            .select('*')
            .order('rank', { ascending: true })

        // 2. Get Progress Array
        const { data: progress, error: pErr } = await admin
            .from('progress')
            .select('team_id, round1_completed, round2_completed, round3_completed, round4_completed, round5_completed, quiz_streak')

        // 3. Get Submissions Audit Logs
        const { data: audits, error: aErr } = await admin
            .from('submission_logs' as never)
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100)
            
        // 4. Get Rate limits
        const { data: rateLimits, error: rErr } = await admin
            .from('submission_log')
            .select('team_id, round, attempt_count')
            
        if (lErr || pErr || aErr || rErr) {
            console.error(lErr, pErr, aErr, rErr)
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
        }

        return NextResponse.json({
            status: 'success',
            competition_active: true,
            leaderboard,
            progress_overview: progress,
            rate_limits: rateLimits,
            recent_audit_logs: audits
        })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to retrieve admin stats', details: String(e) }, { status: 500 })
    }
}

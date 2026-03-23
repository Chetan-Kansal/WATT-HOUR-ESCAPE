import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const admin = createSupabaseAdmin()

        // 1. Get Progress Array
        const { data: progress, error: pErr } = await admin
            .from('progress')
            .select('team_id, round1_completed, round2_completed, round3_completed, round4_completed, round5_completed, round6_completed, round7_completed, round8_completed, round9_completed, round10_completed, quiz_streak')

        // 2. Get Submissions Audit Logs
        const { data: audits, error: aErr } = await admin
            .from('submission_logs' as never)
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100)
            
        // 3. Get Rate limits
        const { data: rateLimits, error: rErr } = await admin
            .from('submission_log')
            .select('team_id, round, attempt_count')
            
        if (pErr || aErr || rErr) {
            console.error(pErr, aErr, rErr)
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
        }

        return NextResponse.json({
            status: 'success',
            competition_active: true,
            progress_overview: progress,
            rate_limits: rateLimits,
            recent_audit_logs: audits
        })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to retrieve admin stats', details: String(e) }, { status: 500 })
    }
}

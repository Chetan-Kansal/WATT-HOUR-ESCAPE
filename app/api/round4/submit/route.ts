import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { Round4SubmitSchema } from '@/lib/validation/schemas'
import { canAccessRound, completeRound, logSubmissionAttempt, logIPAddress, logAuditSubmission } from '@/lib/roundLogic'

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 4)
        if (!canAccess) return NextResponse.json({ error: 'Round 3 not completed' }, { status: 403 })

        const { blocked, reason, remaining } = await logSubmissionAttempt(user.id, 4)
        if (blocked) {
            const message = reason === 'cooldown' 
                ? `Too fast! Please wait ${remaining} seconds.` 
                : 'Maximum attempts reached for this round.'
            return NextResponse.json({ error: message }, { status: 429 })
        }

        await logIPAddress(user.id, ip, '/api/round4/submit')

        // Parse JSON body
        const body = await req.json()
        const parsed = Round4SubmitSchema.safeParse(body)
        if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

        const { score } = parsed.data
        const MIN_SCORE = 700

        const admin = createSupabaseAdmin()

        const { data: progress } = await admin
            .from('progress')
            .select('round4_completed')
            .eq('team_id', user.id)
            .single()

        if (progress?.round4_completed) {
            return NextResponse.json({ error: 'Round 4 already completed' }, { status: 400 })
        }

        const passed = score >= MIN_SCORE

        if (passed) await completeRound(user.id, 4)

        const resultMessage = passed
            ? '✓ Grid synchronized! Round 4 complete.'
            : `✗ Current sync: ${score}/700. Insufficient power levels.`

        await logAuditSubmission(user.id, 4, `Power Runner Score: ${score}. Passed: ${passed}`, ip)

        const { data: team } = await admin.from('teams').select('role').eq('id', user.id).single()
        const isAdmin = team?.role === 'admin'

        return NextResponse.json({
            score,
            threshold: MIN_SCORE,
            passed,
            message: resultMessage,
            is_admin: isAdmin
        })
    } catch (e) {
        console.error('Round 4 Error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

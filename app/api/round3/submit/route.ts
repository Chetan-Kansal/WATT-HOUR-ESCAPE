import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { Round3SubmitSchema } from '@/lib/validation/schemas'
import { canAccessRound, completeRound, logSubmissionAttempt, logIPAddress, logAuditSubmission } from '@/lib/roundLogic'

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 3)
        if (!canAccess) return NextResponse.json({ error: 'Round 2 not completed' }, { status: 403 })

        const { blocked, reason, remaining } = await logSubmissionAttempt(user.id, 3)
        if (blocked) {
            const message = reason === 'cooldown' 
                ? `Too fast! Please wait ${remaining} seconds.` 
                : 'Maximum attempts reached for this round.'
            return NextResponse.json({ error: message }, { status: 429 })
        }

        await logIPAddress(user.id, ip, '/api/round3/submit')

        const body = await req.json()
        const parsed = Round3SubmitSchema.safeParse(body)
        if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

        const { problem_id, selected_option, success } = parsed.data
        const admin = createSupabaseAdmin()

        const { data: problem } = await admin
            .from('circuit_problems')
            .select('correct_option, explanation, title')
            .eq('id', problem_id)
            .single()

        if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 })

        const { data: progress } = await admin
            .from('progress')
            .select('round3_completed')
            .eq('team_id', user.id)
            .single()

        if (progress?.round3_completed) return NextResponse.json({ error: 'Round 3 already completed' }, { status: 400 })

        const passed = success === true || selected_option === problem.correct_option
        if (passed) await completeRound(user.id, 3)

        const resultMessage = passed ? '✓ Grid Synchronized! Round 3 complete.' : '✗ Grid instability detected. Try again!'

        await logAuditSubmission(user.id, 3, `Success: ${success}, Option: ${selected_option} for ${problem.title}. Passed: ${passed}`, ip)

        const { data: team } = await admin.from('teams').select('role').eq('id', user.id).single()
        const isAdmin = team?.role === 'admin'

        return NextResponse.json({
            passed,
            explanation: passed ? problem.explanation : null,
            message: resultMessage,
            is_admin: isAdmin
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { Round2SubmitSchema } from '@/lib/validation/schemas'
import { ROUND2_PROBLEMS } from '@/lib/round2/constants'
import { completeRound } from '@/lib/roundLogic'

export const dynamic = 'force-dynamic'

function validationError(msg: string) {
    return NextResponse.json({ error: msg }, { status: 400 })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const validated = Round2SubmitSchema.safeParse(body)
        if (!validated.success) {
            return validationError(validated.error.errors[0].message)
        }

        const { problem_id, answer } = validated.data
        const problem = ROUND2_PROBLEMS.find(p => p.id === problem_id)

        if (!problem) {
            return NextResponse.json({ error: 'Invalid problem ID' }, { status: 400 })
        }

        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const admin = createSupabaseAdmin()
        const { data: team, error: teamError } = await admin.from('teams').select('id, role').eq('id', user.id).single()
        if (teamError || !team) {
            return NextResponse.json({ error: 'Failed to verify identity' }, { status: 500 })
        }

        // Simple string comparison — the entire validation logic
        const isCorrect = answer.trim().toLowerCase() === problem.correctAnswer.toLowerCase()

        if (!isCorrect) {
            return NextResponse.json({
                success: false,
                message: 'CORE REJECTED',
                details: `Incorrect value. The reactor core did not accept "${answer.trim()}". Re-analyze the puzzle.`
            })
        }

        // --- Correct answer: handle progression ---
        const { data: progress } = await admin.from('progress').select('round2_problem_index').eq('team_id', user.id).single()
        const currentIndex = progress?.round2_problem_index ?? 0

        let nextIndex = currentIndex
        if (problem_id === currentIndex) {
            nextIndex = currentIndex + 1
        }

        const isRoundComplete = nextIndex >= ROUND2_PROBLEMS.length

        const updateData: any = { round2_problem_index: nextIndex }
        if (isRoundComplete) {
            updateData.round2_completed = true
        }

        await admin.from('progress').update(updateData as never).eq('team_id', user.id)

        if (isRoundComplete) {
            await completeRound(user.id, 2)
        }

        return NextResponse.json({
            success: true,
            message: isRoundComplete
                ? '⚡ ALL CORES ONLINE — ROUND 2 COMPLETE'
                : `⚡ CORE ${problem.coreNumber} ONLINE — Moving to next core`,
            nextLevel: isRoundComplete ? null : nextIndex,
            isRoundComplete
        })

    } catch (err: any) {
        console.error('[Round 2 Submit Error]:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

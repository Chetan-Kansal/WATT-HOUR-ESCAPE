import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdmin } from '@/lib/supabase/server'
import { ROUND2_PROBLEMS } from '@/lib/round2/constants'
import { Round2SubmitSchema, validationError } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const validated = Round2SubmitSchema.safeParse(body)
        
        if (!validated.success) {
            return validationError(validated.error.errors[0].message)
        }

        const { problem_id, selected_line, selected_fix } = validated.data
        const problem = ROUND2_PROBLEMS.find(p => p.id === problem_id)

        if (!problem) {
            return NextResponse.json({ error: 'Invalid problem ID' }, { status: 400 })
        }

        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const admin = createSupabaseAdmin()
        const { data: team, error: teamError } = await admin.from('teams').select('id, role, last_submission_time').eq('id', user.id).single()
        if (teamError || !team) {
            return NextResponse.json({ error: 'Failed to verify identity' }, { status: 500 })
        }

        // 5 second cooldown
        const now = Date.now()
        const lastSub = team.last_submission_time ? new Date(team.last_submission_time).getTime() : 0
        if (now - lastSub < 5000) {
            return NextResponse.json({ error: 'System cooling down. Please wait 5 seconds.' }, { status: 429 })
        }

        const isCorrectLine = selected_line === problem.buggyLineIndex
        const isCorrectFix = selected_fix === problem.correctFixIndex
        const isSuccess = isCorrectLine && isCorrectFix

        // Update submission timestamp
        await admin
            .from('teams')
            .update({ last_submission_time: new Date().toISOString() } as never)
            .eq('id', team.id)

        if (!isSuccess) {
            let errorDetail = ""
            if (!isCorrectLine) errorDetail = "SCAN FAILED: Logic leak not located at selected coordinates."
            else if (!isCorrectFix) errorDetail = "REPAIR FAILED: Selected logic module is incompatible with the leak."

            return NextResponse.json({
                success: false,
                message: 'REPAIR FAILED',
                details: errorDetail
            })
        }

        // Handle progression
        const { data: progress } = await admin.from('progress').select('round2_problem_index').eq('team_id', user.id).single()
        const currentIndex = progress?.round2_problem_index ?? 0
        
        let nextIndex = currentIndex
        if (problem_id === currentIndex) {
            nextIndex = currentIndex + 1
        }

        const isRoundComplete = nextIndex >= ROUND2_PROBLEMS.length

        // Update progress in DB
        const updateData: any = {
            round2_problem_index: nextIndex
        }
        if (isRoundComplete) {
            updateData.round2_completed = true
        }

        await admin.from('progress').update(updateData as never).eq('team_id', user.id)

        // If round complete, move to Round 3
        if (isRoundComplete) {
            await admin.from('teams').update({ current_round: 3 } as never).eq('id', user.id)
        }

        return NextResponse.json({
            success: true,
            message: isRoundComplete ? 'ACCESS GRANTED: ROUND 2 COMPLETE' : 'LOGIC REPAIRED: MOVING TO NEXT SECTOR',
            nextLevel: isRoundComplete ? null : nextIndex,
            isRoundComplete
        })

    } catch (err: any) {
        console.error('[Round 2 Submit Error]:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

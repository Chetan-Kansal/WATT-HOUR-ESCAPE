import { NextResponse } from 'next/server'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { completeRound } from '@/lib/roundLogic'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
    try {
        const team = await getAuthenticatedTeam()
        if (!team || team.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { action, round } = await req.json()
        const admin = createSupabaseAdmin()

        if (action === 'reset') {
            console.log(`Admin ${team.id} is resetting their data...`)
            
            // Reset team progress
            const { error: teamError } = await admin
                .from('teams')
                .update({ 
                    current_round: 0, 
                    start_time: null, 
                    end_time: null, 
                    total_time: null,
                    status: 'registered'
                } as never)
                .eq('id', team.id)

            if (teamError) {
                console.error("Reset teams error:", teamError)
                return NextResponse.json({ error: `Teams update failed: ${teamError.message}` }, { status: 500 })
            }

            // Clear/Reset progress table row
            const { error: progError } = await admin
                .from('progress')
                .upsert({
                    team_id: team.id,
                    round1_completed: false,
                    round2_completed: false,
                    round3_completed: false,
                    round4_completed: false,
                    round5_completed: false,
                    round6_completed: false,
                    round7_completed: false,
                    round8_completed: false,
                    round9_completed: false,
                    round10_completed: false,
                    round1_time: null,
                    round2_time: null,
                    round3_time: null,
                    round4_time: null,
                    round5_time: null,
                    round6_time: null,
                    round7_time: null,
                    round8_time: null,
                    round9_time: null,
                    round10_time: null,
                    quiz_streak: 0,
                    quiz_questions_seen: [],
                    debug_attempts: 0,
                    round2_problem_index: 0,
                    round2_attempts: {}
                } as never, { onConflict: 'team_id' })

            if (progError) {
                console.error("Reset progress error:", progError)
                return NextResponse.json({ error: `Progress reset failed: ${progError.message}` }, { status: 500 })
            }

            // Clear rate limits and audit logs
            await admin.from('submission_log').delete().eq('team_id', team.id)
            await admin.from('submission_logs' as never).delete().eq('team_id', team.id)

            revalidatePath('/dashboard')
            revalidatePath('/admin/testing')

            console.log(`Reset complete for ${team.id}`)
            return NextResponse.json({ success: true, message: 'All your progress and mission logs have been wiped.' })
        }

        if (action === 'complete' && round) {
            // Force complete a round
            await completeRound(team.id, round)
            return NextResponse.json({ success: true, message: `Round ${round} marked as complete` })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        console.error('Admin test action error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

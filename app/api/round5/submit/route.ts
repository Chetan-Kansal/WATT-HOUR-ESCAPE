import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { Round5SubmitSchema } from '@/lib/validation/schemas'
import { canAccessRound, logSubmissionAttempt, logIPAddress } from '@/lib/roundLogic'
import { finalizeTeamTimer } from '@/lib/timer'

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 5)
        if (!canAccess) return NextResponse.json({ error: 'Round 4 not completed' }, { status: 403 })

        const { blocked } = await logSubmissionAttempt(user.id, 5)
        if (blocked) return NextResponse.json({ error: 'Too many attempts. Wait 1 minute.' }, { status: 429 })

        await logIPAddress(user.id, ip, '/api/round5/submit')

        const body = await req.json()
        const parsed = Round5SubmitSchema.safeParse(body)
        if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

        const { key } = parsed.data
        const admin = createSupabaseAdmin()

        // Check already completed
        const { data: progress } = await admin
            .from('progress')
            .select('round5_completed')
            .eq('team_id', user.id)
            .single()

        if (progress?.round5_completed) {
            return NextResponse.json({ error: 'Round 5 already completed' }, { status: 400 })
        }

        // Validate final key
        const { data: finalKey } = await admin
            .from('morse_data')
            .select('word')
            .eq('is_final_key', true)
            .eq('is_active', true)
            .single()

        if (!finalKey) return NextResponse.json({ error: 'Final key not configured' }, { status: 500 })

        const isCorrect = key.toUpperCase() === finalKey.word.toUpperCase()

        if (!isCorrect) {
            return NextResponse.json({
                passed: false,
                message: '✗ That\'s not the correct key. Decode the audio clips more carefully.',
            })
        }

        // 🏆 CORRECT! Finalize the event
        const { data: team } = await admin
            .from('teams')
            .select('start_time')
            .eq('id', user.id)
            .single()

        if (!team?.start_time) {
            return NextResponse.json({ error: 'Team has no start time' }, { status: 500 })
        }

        const totalTime = await finalizeTeamTimer(user.id, team.start_time)

        // Mark round 5 complete
        const now = new Date().toISOString()
        await admin.from('progress').update({
            round5_completed: true,
            round5_time: now,
            updated_at: now,
        }).eq('team_id', user.id)

        await admin.from('teams').update({ current_round: 5 }).eq('id', user.id)

        // Get final rank from leaderboard view
        const { data: leaderboard } = await admin
            .from('leaderboard' as never)
            .select('rank')
            .eq('id', user.id)
            .single()

        const finalRank = (leaderboard as { rank?: number } | null)?.rank ?? null

        return NextResponse.json({
            passed: true,
            total_time: totalTime,
            final_rank: finalRank,
            message: '🎉 Congratulations! You have completed all 5 rounds!',
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

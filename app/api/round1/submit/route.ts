import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { Round1SubmitSchema } from '@/lib/validation/schemas'
import { canAccessRound, completeRound, logSubmissionAttempt, logIPAddress, logAuditSubmission } from '@/lib/roundLogic'

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check round access
        const canAccess = await canAccessRound(user.id, 1)
        if (!canAccess) return NextResponse.json({ error: 'Cannot access this round' }, { status: 403 })

        // Rate limiting
        const { blocked, reason, remaining } = await logSubmissionAttempt(user.id, 1)
        if (blocked) {
            const message = reason === 'cooldown' 
                ? `Too fast! Please wait ${remaining} seconds.` 
                : 'Maximum attempts reached for this round.'
            return NextResponse.json({ error: message }, { status: 429 })
        }

        // Log IP
        await logIPAddress(user.id, ip, '/api/round1/submit', 'POST')

        // Validate input
        const body = await req.json()
        const parsed = Round1SubmitSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
        }

        const { question_id, answer } = parsed.data
        const admin = createSupabaseAdmin()

        // Check answer server-side (correct_option never sent to client)
        const { data: question } = await admin
            .from('quiz_questions')
            .select('correct_option')
            .eq('id', question_id)
            .eq('is_active', true)
            .single()

        if (!question) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 })
        }

        // Get current streak
        const { data: progress } = await admin
            .from('progress')
            .select('quiz_streak, round1_completed')
            .eq('team_id', user.id)
            .single()

        if (progress?.round1_completed) {
            return NextResponse.json({ error: 'Round 1 already completed' }, { status: 400 })
        }

        const isCorrect = answer === question.correct_option
        const currentStreak = progress?.quiz_streak ?? 0
        const newStreak = isCorrect ? currentStreak + 1 : 0

        // Update streak in progress using upsert to ensure row exists
        const { error: streakError } = await admin
            .from('progress')
            .upsert({ 
                team_id: user.id,
                quiz_streak: newStreak, 
                updated_at: new Date().toISOString() 
            } as never, { onConflict: 'team_id' })

        if (streakError) {
            console.error("Round 1 streak upsert error:", streakError)
        }

        // Check for completion (streak of 5)
        let completed = false
        if (newStreak >= 5) {
            await completeRound(user.id, 1)
            completed = true
        }

        const resultMessage = isCorrect
            ? newStreak >= 5
                ? '🎉 Round complete! Streak of 5 achieved!'
                : `✓ Correct! Streak: ${newStreak}/5`
            : '✗ Wrong answer. Streak reset.'

        await logAuditSubmission(user.id, 1, `Answered ${answer} (QID: ${question_id}): ${isCorrect ? 'Correct' : 'Incorrect'}`, ip)

        return NextResponse.json({
            correct: isCorrect,
            streak: newStreak,
            completed,
            message: resultMessage,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

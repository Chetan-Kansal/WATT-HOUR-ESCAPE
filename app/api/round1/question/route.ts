import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound } from '@/lib/roundLogic'

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 1)
        if (!canAccess) return NextResponse.json({ error: 'Event not started' }, { status: 403 })

        const admin = createSupabaseAdmin()

        // Get already-seen question IDs to avoid repeats
        const { data: progress } = await admin
            .from('progress')
            .select('quiz_questions_seen, quiz_streak')
            .eq('team_id', user.id)
            .single()

        const seen = (progress?.quiz_questions_seen as string[]) || []

        // Select a random question from unseen ones
        let query = admin
            .from('quiz_questions')
            .select('id, question, option_a, option_b, option_c, option_d, category, difficulty')
            .eq('is_active', true)

        // Exclude already-seen questions (up to 30 seen before pool reset)
        if (seen.length > 0 && seen.length < 30) {
            query = query.not('id', 'in', `(${seen.join(',')})`)
        } else if (seen.length >= 30) {
            // Reset seen list when pool is exhausted
            await admin.from('progress').update({ quiz_questions_seen: [] }).eq('team_id', user.id)
        }

        const { data: questions } = await query

        if (!questions || questions.length === 0) {
            return NextResponse.json({ error: 'No questions available' }, { status: 500 })
        }

        // Pick random question
        const randomIndex = Math.floor(Math.random() * questions.length)
        const question = questions[randomIndex]

        // Track this question as seen
        const updatedSeen = Array.from(new Set([...seen, question.id as string]))
        await admin
            .from('progress')
            .update({ quiz_questions_seen: updatedSeen })
            .eq('team_id', user.id)

        return NextResponse.json({
            id: question.id,
            question: question.question,
            options: {
                A: question.option_a,
                B: question.option_b,
                C: question.option_c,
                D: question.option_d,
            },
            category: question.category,
            difficulty: question.difficulty,
            current_streak: progress?.quiz_streak ?? 0,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

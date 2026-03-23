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
        const { data: allQuestions, error: allQError } = await admin
            .from('quiz_questions')
            .select('id, question, option_a, option_b, option_c, option_d, category, difficulty')
            .eq('is_active', true)

        if (allQError) {
            console.error("Round 1 All Questions Fetch Error:", allQError)
            return NextResponse.json({ error: `Database error: ${allQError.message}` }, { status: 500 })
        }

        if (!allQuestions || allQuestions.length === 0) {
            return NextResponse.json({ error: 'No questions available. Please ensure the database is seeded.' }, { status: 500 })
        }

        // Filter out seen questions
        let availableQuestions = allQuestions.filter(q => !seen.includes(q.id))

        // If pool exhausted, reset seen list and use all questions
        if (availableQuestions.length === 0) {
            console.log(`Pool exhausted for team ${user.id}. Resetting seen list.`)
            await admin.from('progress').upsert({ team_id: user.id, quiz_questions_seen: [] } as never, { onConflict: 'team_id' })
            availableQuestions = allQuestions
        }

        // Pick random question from available pool
        const randomIndex = Math.floor(Math.random() * availableQuestions.length)
        const question = availableQuestions[randomIndex]

        // Track this question as seen
        const updatedSeen = Array.from(new Set([...seen, question.id as string]))
        const { error: upsertError } = await admin
            .from('progress')
            .upsert({ 
                team_id: user.id,
                quiz_questions_seen: updatedSeen,
                updated_at: new Date().toISOString()
            } as never, { onConflict: 'team_id' })

        if (upsertError) {
            console.error("Round 1 seen list upsert error:", upsertError)
        }

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

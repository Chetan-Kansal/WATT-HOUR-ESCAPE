import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound } from '@/lib/roundLogic'

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 2)
        if (!canAccess) return NextResponse.json({ error: 'Round 1 not yet completed' }, { status: 403 })

        const admin = createSupabaseAdmin()

        // Get a random active debug problem
        const { data: problems } = await admin
            .from('debug_problems')
            .select('id, title, problem_text, code_snippet, language, test_cases')
            .eq('is_active', true)

        if (!problems || problems.length === 0) {
            return NextResponse.json({ error: 'No problems available' }, { status: 500 })
        }

        const problem = problems[Math.floor(Math.random() * problems.length)]

        // Get current attempt count
        const { data: log } = await admin
            .from('submission_log')
            .select('attempt_count')
            .eq('team_id', user.id)
            .eq('round', 2)
            .single()

        return NextResponse.json({
            id: problem.id,
            title: problem.title,
            problem_text: problem.problem_text,
            code_snippet: problem.code_snippet,
            language: problem.language,
            test_cases: problem.test_cases,
            attempts_used: log?.attempt_count ?? 0,
            max_attempts: 10,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

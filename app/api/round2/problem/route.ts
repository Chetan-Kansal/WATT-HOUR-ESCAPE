import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound } from '@/lib/roundLogic'
import { ROUND2_PROBLEMS } from '@/lib/round2/constants'
import { obfuscateCode } from '@/lib/round2/obfuscate'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 2)
        if (!canAccess) return NextResponse.json({ error: 'Round 1 not yet completed' }, { status: 403 })

        const admin = createSupabaseAdmin()
        const { data: team } = await admin.from('teams').select('role').eq('id', user.id).single()
        const isAdmin = team?.role === 'admin'

        // Get player progress
        const { data: progress, error: progError } = await admin
            .from('progress')
            .select('round2_problem_index, round2_attempts, round2_completed')
            .eq('team_id', user.id)
            .single()

        if (progError) {
            console.error("Error fetching progress:", progError)
            return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
        }

        const currentIndex = progress?.round2_problem_index ?? 0
        const attemptsMap = (progress?.round2_attempts as Record<string, number>) || {}

        // Admin support: Allow overriding index via query param if requester is admin
        const urlIndex = req.nextUrl.searchParams.get('index')
        const targetIndex = (isAdmin && urlIndex !== null) ? parseInt(urlIndex) : currentIndex

        if (targetIndex >= ROUND2_PROBLEMS.length) {
            return NextResponse.json({
                completed: true,
                message: "All problems completed"
            })
        }

        const problem = ROUND2_PROBLEMS[targetIndex]
        const attemptsUsed = attemptsMap[targetIndex.toString()] || 0

        // Obfuscate code: remove BUG comments
        const obfuscatedSnippet = {
            python: obfuscateCode(problem.brokenCode.python, 'python'),
            javascript: obfuscateCode(problem.brokenCode.javascript, 'javascript')
        }

        return NextResponse.json({
            id: problem.id,
            title: problem.title,
            problem_text: problem.description,
            code_snippet: obfuscatedSnippet,
            expected_behavior: problem.expectedBehavior,
            attempts_used: attemptsUsed,
            max_attempts: 10,
            current_problem_index: targetIndex,
            total_problems: ROUND2_PROBLEMS.length,
            is_admin: isAdmin
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

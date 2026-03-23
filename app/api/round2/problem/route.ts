import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound } from '@/lib/roundLogic'
import { ROUND2_PROBLEMS } from '@/lib/round2/constants'

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

        const urlIndex = req.nextUrl.searchParams.get('index')
        const targetIndex = (isAdmin && urlIndex !== null) ? parseInt(urlIndex) : currentIndex

        if (targetIndex >= ROUND2_PROBLEMS.length) {
            return NextResponse.json({
                completed: true,
                message: "All reactor cores online"
            })
        }

        const problem = ROUND2_PROBLEMS[targetIndex]

        // Return everything EXCEPT correctAnswer
        return NextResponse.json({
            id: problem.id,
            coreNumber: problem.coreNumber,
            title: problem.title,
            type: problem.type,
            description: problem.description,
            displayData: problem.displayData,
            hint: problem.hint ?? null,
            choices: problem.choices ?? null,
            current_problem_index: targetIndex,
            total_problems: ROUND2_PROBLEMS.length,
            is_admin: isAdmin
        })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

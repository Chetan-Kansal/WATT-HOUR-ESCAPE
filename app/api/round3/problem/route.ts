import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound } from '@/lib/roundLogic'

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 3)
        if (!canAccess) return NextResponse.json({ error: 'Round 2 not completed' }, { status: 403 })

        const admin = createSupabaseAdmin()
        const { data: problems } = await admin
            .from('circuit_problems')
            .select('id, title, problem, diagram_options')
            .eq('is_active', true)

        if (!problems || problems.length === 0) {
            return NextResponse.json({ error: 'No problems available' }, { status: 500 })
        }

        const problem = problems[Math.floor(Math.random() * problems.length)]

        let options = problem.diagram_options
        console.log(`[Round 3 API] problem_id: ${problem.id}, options type: ${typeof options}`)
        
        if (typeof options === 'string') {
            try {
                options = JSON.parse(options)
            } catch (e) {
                console.error("[Round 3 API] Failed to parse diagram_options:", e)
            }
        }

        return NextResponse.json({
            id: problem.id,
            title: problem.title,
            problem: problem.problem,
            diagram_options: options,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

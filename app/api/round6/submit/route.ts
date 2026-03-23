import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import { canAccessRound, completeRound, logSubmissionAttempt, logAuditSubmission } from '@/lib/roundLogic'

export async function POST(req: NextRequest) {
    try {
        const team = await getAuthenticatedTeam()
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(team.id, 6)
        if (!canAccess) return NextResponse.json({ error: 'Previous rounds not completed' }, { status: 403 })

        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        const { passed } = await req.json()

        const { blocked, remaining, reason } = await logSubmissionAttempt(team.id, 6)
        if (blocked) {
            return NextResponse.json({ 
                error: reason === 'cooldown' ? `Rate limit exceeded. Wait ${remaining}s.` : 'Too many attempts.' 
            }, { status: 429 })
        }

        if (passed) {
            await completeRound(team.id, 6)
            await logAuditSubmission(team.id, 6, "Logic Leak: Success", ip)
            return NextResponse.json({ passed: true })
        } else {
            await logAuditSubmission(team.id, 6, "Logic Leak: Failed", ip)
            return NextResponse.json({ passed: false, error: 'Logic gates mismatched.' })
        }
    } catch (e) {
        console.error("Round 6 Submission Error:", e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

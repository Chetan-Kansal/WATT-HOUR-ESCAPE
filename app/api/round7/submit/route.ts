import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import { canAccessRound, completeRound, logSubmissionAttempt, logAuditSubmission } from '@/lib/roundLogic'

export async function POST(req: NextRequest) {
    try {
        const team = await getAuthenticatedTeam()
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(team.id, 7)
        if (!canAccess) return NextResponse.json({ error: 'Previous rounds not completed' }, { status: 403 })

        const ip = req.headers.get('x-forwarded-for') || 'unknown'
        const { passed, score } = await req.json()

        const { blocked, remaining, reason } = await logSubmissionAttempt(team.id, 7)
        if (blocked) {
            return NextResponse.json({ 
                error: reason === 'cooldown' ? `Rate limit exceeded. Wait ${remaining}s.` : 'Too many attempts.' 
            }, { status: 429 })
        }

        if (passed && score >= 3) {
            await completeRound(team.id, 7)
            await logAuditSubmission(team.id, 7, `Terminal Infiltration: Success (Score: ${score})`, ip)
            return NextResponse.json({ passed: true })
        } else {
            await logAuditSubmission(team.id, 7, `Terminal Infiltration: Failed (Score: ${score})`, ip)
            return NextResponse.json({ passed: false, error: 'Insufficient data patterns captured.' })
        }
    } catch (e) {
        console.error("Round 7 Submission Error:", e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

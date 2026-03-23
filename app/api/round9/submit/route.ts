import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import { completeRound, logSubmissionAttempt, logAuditSubmission, logIPAddress } from '@/lib/roundLogic'

export async function POST(req: NextRequest) {
    try {
        const team = await getAuthenticatedTeam()
        if (!team) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
        await logIPAddress(team.id, ip, '/api/round9/submit')

        const { score } = await req.json()

        // Rate limiting
        const { blocked, reason, remaining } = await logSubmissionAttempt(team.id, 9)
        if (blocked) {
            return NextResponse.json({ 
                error: reason === 'cooldown' ? `Cooldown active. Wait ${remaining}s.` : 'Max attempts reached.' 
            }, { status: 429 })
        }

        if (score < 20) {
            await logAuditSubmission(team.id, 9, 'FAILURE_INSUFFICIENT_SCORE', ip)
            return NextResponse.json({ error: 'Target quota not met' }, { status: 400 })
        }

        // Complete round
        await completeRound(team.id, 9)
        await logAuditSubmission(team.id, 9, 'SUCCESS', ip)

        return NextResponse.json({ success: true, message: 'Packet storm neutralized. Round 9 complete.' })
    } catch (error: any) {
        console.error('Round 9 submission error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

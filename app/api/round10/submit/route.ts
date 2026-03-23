import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import { completeRound, logSubmissionAttempt, logAuditSubmission, logIPAddress } from '@/lib/roundLogic'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const team = await getAuthenticatedTeam()
        if (!team) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
        await logIPAddress(team.id, ip, '/api/round10/submit')

        const { hits } = await req.json()

        // Rate limiting
        const { blocked, reason, remaining } = await logSubmissionAttempt(team.id, 10)
        if (blocked) {
            return NextResponse.json({ 
                error: reason === 'cooldown' ? `Cooldown active. Wait ${remaining}s.` : 'Max attempts reached.' 
            }, { status: 429 })
        }

        if (hits < 40) {
            await logAuditSubmission(team.id, 10, `FAILURE_INSUFFICIENT_HITS_${hits}`, ip)
            return NextResponse.json({ error: 'Core integrity maintained. Insufficient data reflections.' }, { status: 400 })
        }

        // Complete final round
        await completeRound(team.id, 10)
        
        // Mark team status as 'completed' and set end_time
        const admin = createSupabaseAdmin()
        const now = new Date().toISOString()
        
        // Calculate total time
        const startTime = team.start_time ? new Date(team.start_time).getTime() : Date.now()
        const endTime = new Date(now).getTime()
        const totalTime = Math.floor((endTime - startTime) / 1000)

        await admin
            .from('teams')
            .update({ 
                status: 'completed', 
                end_time: now,
                total_time: totalTime
            } as never)
            .eq('id', team.id)

        await logAuditSubmission(team.id, 10, `SUCCESS_CORE_OVERLOAD_HITS_${hits}`, ip)

        return NextResponse.json({ success: true, message: 'Core overloaded. Mission accomplished. System Architect overridden.' })
    } catch (error: any) {
        console.error('Round 10 submission error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

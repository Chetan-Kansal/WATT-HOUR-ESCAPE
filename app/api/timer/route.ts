import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { getElapsedSeconds } from '@/lib/timer'

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const admin = createSupabaseAdmin()
        const { data: team } = await admin
            .from('teams')
            .select('start_time, end_time, status, total_time')
            .eq('id', user.id)
            .single()

        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

        const serverTime = new Date().toISOString()
        const elapsed = team.start_time ? getElapsedSeconds(team.start_time) : 0

        return NextResponse.json({
            server_time: serverTime,
            start_time: team.start_time,
            end_time: team.end_time,
            elapsed_seconds: team.status === 'completed' ? (team.total_time ?? 0) : elapsed,
            status: team.status,
            total_time: team.total_time,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

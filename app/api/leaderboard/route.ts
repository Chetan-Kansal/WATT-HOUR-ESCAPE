import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { formatTime } from '@/lib/timer'

// Cache for 10 seconds to handle high load
export const revalidate = 10

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const admin = createSupabaseAdmin()

        const { data: entries } = await admin
            .from('leaderboard' as never)
            .select('id, team_name, current_round, status, start_time, end_time, total_time, rank')
            .limit(50)

        const leaderboard = ((entries as Array<{
            id: string
            team_name: string
            current_round: number
            status: string
            total_time: number | null
            rank: number
        }>) ?? []).map(entry => ({
            rank: entry.rank,
            team_name: entry.team_name,
            current_round: entry.current_round,
            status: entry.status,
            total_time: entry.total_time,
            formatted_time: entry.total_time ? formatTime(entry.total_time) : '—',
            is_current_team: entry.id === user.id,
        }))

        return NextResponse.json({ leaderboard, updated_at: new Date().toISOString() })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

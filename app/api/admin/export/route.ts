import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

function isAdmin(req: NextRequest) {
    return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createSupabaseAdmin()

    const { data: teams } = await admin
        .from('teams')
        .select(`
      id, team_name, email, status, current_round,
      start_time, end_time, total_time, created_at,
      progress(round1_completed, round2_completed, round3_completed, round4_completed, round5_completed)
    `)
        .order('total_time', { ascending: true, nullsFirst: false })

    if (!teams) return NextResponse.json({ error: 'No data' }, { status: 500 })

    const csvRows = [
        ['Rank', 'Team Name', 'Email', 'Status', 'Current Round', 'R1', 'R2', 'R3', 'R4', 'R5', 'Total Time (s)', 'Start Time', 'End Time'],
        ...teams.map((t, i) => {
            const p = Array.isArray(t.progress) ? t.progress[0] : t.progress
            return [
                i + 1,
                t.team_name,
                t.email,
                t.status,
                t.current_round,
                p?.round1_completed ? '✓' : '✗',
                p?.round2_completed ? '✓' : '✗',
                p?.round3_completed ? '✓' : '✗',
                p?.round4_completed ? '✓' : '✗',
                p?.round5_completed ? '✓' : '✗',
                t.total_time ?? '',
                t.start_time ?? '',
                t.end_time ?? '',
            ]
        }),
    ]

    const csv = csvRows.map(row => row.map(String).join(',')).join('\n')

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="techchallenge-results-${new Date().toISOString().split('T')[0]}.csv"`,
        },
    })
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

function isAdmin(req: NextRequest) {
    const token = req.headers.get('x-admin-secret')
    return token === process.env.ADMIN_SECRET
}

// GET /api/admin/teams — list all teams
export async function GET(req: NextRequest) {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createSupabaseAdmin()
    const { data: teams } = await admin
        .from('teams')
        .select(`*, progress(*)`)
        .order('created_at', { ascending: false })

    return NextResponse.json({ teams })
}

// DELETE /api/admin/teams — reset all teams
export async function DELETE(req: NextRequest) {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createSupabaseAdmin()
    await admin.from('progress').delete().neq('team_id', '00000000-0000-0000-0000-000000000000')
    await admin.from('teams').update({
        status: 'registered' as const,
        current_round: 0,
        start_time: null,
        end_time: null,
        total_time: null,
    } as never).neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json({ message: 'All teams reset' })
}

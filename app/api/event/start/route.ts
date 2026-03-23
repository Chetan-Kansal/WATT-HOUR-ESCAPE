import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const admin = createSupabaseAdmin()
        const { data: team } = await admin
            .from('teams')
            .select('id, status, start_time')
            .eq('id', user.id)
            .single()

        if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
        if (team.start_time) return NextResponse.json({ error: 'Event already started' }, { status: 400 })

        const now = new Date().toISOString()

        await admin.from('teams').update({
            start_time: now,
            status: 'active',
            current_round: 0,
        }).eq('id', user.id)

        // Ensure progress row exists
        const { data: prog } = await admin.from('progress').select('id').eq('team_id', user.id).single()
        if (!prog) {
            await admin.from('progress').insert({ team_id: user.id })
        }

        return NextResponse.json({ success: true, start_time: now })
    } catch (e) {
        console.error("Event Start Error:", e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

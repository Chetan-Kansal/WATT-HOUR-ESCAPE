import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound } from '@/lib/roundLogic'

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 5)
        if (!canAccess) return NextResponse.json({ error: 'Round 4 not completed' }, { status: 403 })

        const admin = createSupabaseAdmin()
        const { data: audioClips } = await admin
            .from('morse_data')
            .select('id, audio_url, morse_code, sort_order')
            // NOTE: never select 'word' or 'is_final_key' here
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (!audioClips || audioClips.length === 0) {
            return NextResponse.json({ error: 'No audio clips available' }, { status: 500 })
        }

        return NextResponse.json({
            clips: audioClips.map(c => ({
                id: c.id,
                audio_url: c.audio_url,
                morse_code: c.morse_code,
                number: c.sort_order,
            })),
            instructions: 'Decode all 12 Morse code audio clips. One of the decoded words is the final key. Submit it below.',
            hint: 'Each clip represents a single word. Decode carefully — only one is the correct key.',
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

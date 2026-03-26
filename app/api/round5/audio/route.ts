import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound } from '@/lib/roundLogic'
import { ROUND5_SIGNALS } from '@/lib/round5/constants'

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 5)
        if (!canAccess) return NextResponse.json({ error: 'Previous rounds not completed' }, { status: 403 })

        // Return the 3 signal metadata (No direct words, just IDs and labels)
        return NextResponse.json({
            signals: ROUND5_SIGNALS.map(s => ({
                id: s.id,
                label: s.label,
                // The actual word is hidden here, the frontend will use the ID to generate audio
            })),
            instructions: 'Intercept and decode the 3 radio signals. One of them is the final system bypass key. Good luck.',
            hint: 'Each signal is a separate Morse code transmission. Only ONE is the correct key.',
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

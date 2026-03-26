import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { completeRound } from '@/lib/roundLogic'

export async function POST(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const input = (body.key || '').toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

        if (input === 'MORSECODED') {
            await completeRound(user.id, 5)
            return NextResponse.json({
                passed: true,
                total_time: 0,
                message: '🎉 Congratulations! Access Granted.',
            })
        }

        return NextResponse.json({
            passed: false,
            message: `Incorrect key.`,
        })
    } catch (e) {
        console.error('Round 5 Verify Error:', e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

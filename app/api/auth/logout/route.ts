import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { error } = await supabase.auth.signOut()

        if (error) {
            return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

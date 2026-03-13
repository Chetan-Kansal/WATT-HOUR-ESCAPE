import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { LoginSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = LoginSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        const { email, password } = parsed.data
        const supabase = createSupabaseServerClient()

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error || !data.session) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        return NextResponse.json({
            success: true,
            access_token: data.session.access_token,
            user_id: data.user.id,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

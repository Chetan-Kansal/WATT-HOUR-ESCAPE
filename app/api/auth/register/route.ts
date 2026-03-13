import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { RegisterSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const parsed = RegisterSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0].message },
                { status: 400 }
            )
        }

        const { team_name, email, password } = parsed.data
        const admin = createSupabaseAdmin()

        // Check if team name already taken
        const { data: existing } = await admin
            .from('teams')
            .select('id')
            .eq('team_name', team_name)
            .single()

        if (existing) {
            return NextResponse.json({ error: 'Team name already taken' }, { status: 409 })
        }

        // Create Supabase Auth user
        const { data: authData, error: authError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { team_name },
        })

        if (authError || !authData.user) {
            if (authError?.message.includes('already registered')) {
                return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
            }
            return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
        }

        const userId = authData.user.id

        // Insert into teams table
        const { error: teamError } = await admin.from('teams').insert({
            id: userId,
            team_name,
            email,
            current_round: 0,
            status: 'registered' as const,
        } as never)

        if (teamError) {
            // Cleanup auth user on failure
            await admin.auth.admin.deleteUser(userId)
            return NextResponse.json({ error: 'Failed to create team record' }, { status: 500 })
        }

        // Create initial progress row
        await admin.from('progress').insert({ team_id: userId } as never)

        return NextResponse.json({ success: true, team_id: userId }, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

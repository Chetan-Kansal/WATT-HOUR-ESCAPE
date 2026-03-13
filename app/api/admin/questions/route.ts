import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { QuizQuestionSchema } from '@/lib/validation/schemas'

function isAdmin(req: NextRequest) {
    return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const admin = createSupabaseAdmin()
    const { data } = await admin.from('quiz_questions').select('*').order('created_at', { ascending: false })
    return NextResponse.json({ questions: data })
}

export async function POST(req: NextRequest) {
    if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const parsed = QuizQuestionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const admin = createSupabaseAdmin()
    const { data, error } = await admin.from('quiz_questions').insert({
        question: parsed.data.question,
        option_a: parsed.data.option_a,
        option_b: parsed.data.option_b,
        option_c: parsed.data.option_c,
        option_d: parsed.data.option_d,
        correct_option: parsed.data.correct_option,
        category: parsed.data.category,
        difficulty: parsed.data.difficulty,
    } as never).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ question: data }, { status: 201 })
}

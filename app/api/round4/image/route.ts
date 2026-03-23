import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound } from '@/lib/roundLogic'

export async function GET(req: NextRequest) {
    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 4)
        if (!canAccess) return NextResponse.json({ error: 'Round 3 not completed' }, { status: 403 })

        const admin = createSupabaseAdmin()
        const { data: image } = await admin
            .from('image_round')
            .select('id, title, image_url, similarity_threshold')
            .eq('is_active', true)
            .single()

        if (!image) return NextResponse.json({ error: 'No image available' }, { status: 500 })

        return NextResponse.json({
            id: image.id,
            title: image.title,
            image_url: image.image_url,
            threshold: image.similarity_threshold,
            instructions: 'Reverse engineer the target image using AI generation. Your goal is to produce a prompt that generates an image as close to the target as possible. Upload your generated image for neural similarity analysis.',
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { canAccessRound, completeRound, logIPAddress } from '@/lib/roundLogic'

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 4)
        if (!canAccess) return NextResponse.json({ error: 'Round 3 not completed' }, { status: 403 })

        await logIPAddress(user.id, ip, '/api/round4/submit')

        // Parse multipart form data
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const imageId = formData.get('image_id') as string | null

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        if (!imageId) return NextResponse.json({ error: 'Missing image_id' }, { status: 400 })

        // Size limit: 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 413 })
        }

        // Only accept images
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are accepted' }, { status: 400 })
        }

        const admin = createSupabaseAdmin()

        // Get active image with reference URL (never expose prompt)
        const { data: imageRound } = await admin
            .from('image_round')
            .select('id, image_url, similarity_threshold')
            .eq('id', imageId)
            .eq('is_active', true)
            .single()

        if (!imageRound) return NextResponse.json({ error: 'Image round not found' }, { status: 404 })

        const { data: progress } = await admin
            .from('progress')
            .select('round4_completed')
            .eq('team_id', user.id)
            .single()

        if (progress?.round4_completed) {
            return NextResponse.json({ error: 'Round 4 already completed' }, { status: 400 })
        }

        // Forward to Python CLIP microservice
        const PYTHON_URL = process.env.PYTHON_SERVICE_URL
        if (!PYTHON_URL) {
            // Fallback for development: auto-pass at 0.7 similarity
            const mockScore = 0.72
            return NextResponse.json({
                similarity_score: mockScore,
                threshold: imageRound.similarity_threshold,
                passed: mockScore >= imageRound.similarity_threshold,
                message: 'Dev mode: CLIP service not configured.',
            })
        }

        const clipFormData = new FormData()
        clipFormData.append('file', file)
        clipFormData.append('reference_url', imageRound.image_url)

        let clipResult: { similarity: number }
        try {
            const clipRes = await fetch(`${PYTHON_URL}/compare`, {
                method: 'POST',
                body: clipFormData,
                signal: AbortSignal.timeout(30000), // 30s timeout
            })

            if (!clipRes.ok) throw new Error(`CLIP service error: ${clipRes.status}`)
            clipResult = await clipRes.json()
        } catch (e) {
            return NextResponse.json({
                error: 'Image comparison service unavailable. Please try again.',
                details: String(e),
            }, { status: 503 })
        }

        const similarityScore = Math.round(clipResult.similarity * 100) / 100
        const passed = similarityScore >= imageRound.similarity_threshold

        if (passed) await completeRound(user.id, 4)

        return NextResponse.json({
            similarity_score: similarityScore,
            threshold: imageRound.similarity_threshold,
            passed,
            message: passed
                ? '✓ Image similarity passes! Round 4 complete.'
                : `✗ Similarity: ${Math.round(similarityScore * 100)}%. Need ${Math.round(imageRound.similarity_threshold * 100)}%. Try a more similar image.`,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

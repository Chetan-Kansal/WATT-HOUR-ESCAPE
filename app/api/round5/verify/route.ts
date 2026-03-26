import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const input = (body.key || '').toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

        if (input === 'MORSECODED') {
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
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

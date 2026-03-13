import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { Round2SubmitSchema } from '@/lib/validation/schemas'
import { canAccessRound, completeRound, logSubmissionAttempt, logIPAddress } from '@/lib/roundLogic'

// Judge0 language → ID mapping
const LANGUAGE_IDS: Record<string, number> = {
    python: 71,
    javascript: 63,
    cpp: 54,
    java: 62,
}

interface Judge0Result {
    stdout: string | null
    stderr: string | null
    status: { id: number; description: string }
    time: string
    memory: number
    compile_output: string | null
}

async function runOnJudge0(code: string, languageId: number): Promise<Judge0Result> {
    const JUDGE0_BASE = process.env.JUDGE0_BASE_URL ?? 'https://judge0-ce.p.rapidapi.com'
    const API_KEY = process.env.JUDGE0_API_KEY!

    // Submit
    const submitRes = await fetch(`${JUDGE0_BASE}/submissions?wait=false`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        body: JSON.stringify({
            source_code: code,
            language_id: languageId,
            cpu_time_limit: 5,           // 5 second limit
            memory_limit: 128000,        // 128MB limit
            max_processes_and_or_threads: 10,
        }),
    })

    if (!submitRes.ok) throw new Error('Judge0 submission failed')
    const { token } = await submitRes.json()

    // Poll for result (max 10 seconds)
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500))
        const resultRes = await fetch(`${JUDGE0_BASE}/submissions/${token}`, {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
        })
        const result: Judge0Result & { status: { id: number } } = await resultRes.json()
        if (result.status.id > 2) return result // Status > 2 means finished (accepted, WA, TLE, etc.)
    }

    throw new Error('Execution timed out')
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 2)
        if (!canAccess) return NextResponse.json({ error: 'Round 1 not completed' }, { status: 403 })

        // Rate limiting — max 10 attempts for Round 2
        const { count, blocked } = await logSubmissionAttempt(user.id, 2)
        if (blocked) {
            return NextResponse.json(
                { error: 'Maximum attempts reached. Wait 1 minute.' },
                { status: 429 }
            )
        }

        await logIPAddress(user.id, ip, '/api/round2/submit')

        const body = await req.json()
        const parsed = Round2SubmitSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
        }

        const { problem_id, code, language } = parsed.data
        const admin = createSupabaseAdmin()

        // Get expected output (server-only)
        const { data: problem } = await admin
            .from('debug_problems')
            .select('expected_output, judge0_language_id, title')
            .eq('id', problem_id)
            .eq('is_active', true)
            .single()

        if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 })

        // Check already completed
        const { data: progress } = await admin
            .from('progress')
            .select('round2_completed')
            .eq('team_id', user.id)
            .single()

        if (progress?.round2_completed) {
            return NextResponse.json({ error: 'Round 2 already completed' }, { status: 400 })
        }

        const languageId = LANGUAGE_IDS[language] ?? problem.judge0_language_id

        let result: Judge0Result
        try {
            result = await runOnJudge0(code, languageId)
        } catch (e) {
            return NextResponse.json({
                error: 'Code execution service unavailable',
                details: String(e),
            }, { status: 503 })
        }

        const stdout = (result.stdout ?? '').trim()
        const expected = problem.expected_output.trim()
        const passed = stdout === expected

        if (passed) {
            await completeRound(user.id, 2)
        }

        return NextResponse.json({
            passed,
            status: result.status.description,
            stdout: stdout,
            stderr: result.stderr ?? null,
            compile_output: result.compile_output ?? null,
            execution_time: result.time,
            memory_kb: result.memory,
            attempt: count,
            max_attempts: 10,
            message: passed
                ? '✓ Output matches! Round 2 complete.'
                : `✗ Output does not match expected output.`,
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

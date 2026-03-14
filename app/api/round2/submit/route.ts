import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { Round2SubmitSchema } from '@/lib/validation/schemas'
import { canAccessRound, completeRound, logSubmissionAttempt, logIPAddress, logAuditSubmission } from '@/lib/roundLogic'

// Judge0 language → ID mapping
const LANGUAGE_IDS: Record<string, number> = {
    python: 71,
    javascript: 63,
    java: 62,
    cpp: 54,
    c: 50,
}

interface Judge0Result {
    stdout: string | null
    stderr: string | null
    status: { id: number; description: string }
    time: string
    memory: number
    compile_output: string | null
}

async function runOnJudge0(code: string, languageId: number, stdin: string): Promise<Judge0Result> {
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
            stdin: stdin,
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

function normalizeOutput(str: string | null): string {
    if (!str) return ''
    return str.replace(/\r\n/g, '\n').trim()
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const canAccess = await canAccessRound(user.id, 2)
        if (!canAccess) return NextResponse.json({ error: 'Round 1 not completed' }, { status: 403 })

        // Rate limiting
        const { count, blocked, reason } = await logSubmissionAttempt(user.id, 2)
        if (blocked) {
            if (reason === 'limit') {
                return NextResponse.json( { error: 'SUBMISSION LIMIT REACHED' }, { status: 429 } )
            } else {
                return NextResponse.json( { error: 'Please wait 10 seconds between submissions.' }, { status: 429 } )
            }
        }

        await logIPAddress(user.id, ip, '/api/round2/submit')

        const body = await req.json()
        const parsed = Round2SubmitSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
        }

        const { problem_id, code, language } = parsed.data
        const languageId = LANGUAGE_IDS[language.toLowerCase()]
        if (!languageId) {
            return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
        }

        const admin = createSupabaseAdmin()

        // Get expected test cases
        const { data: problem } = await admin
            .from('debug_problems')
            .select('title, test_cases')
            .eq('id', problem_id)
            .eq('is_active', true)
            .single()

        if (!problem) return NextResponse.json({ error: 'Problem not found' }, { status: 404 })

        const { data: progress } = await admin
            .from('progress')
            .select('round2_completed')
            .eq('team_id', user.id)
            .single()

        if (progress?.round2_completed) {
            return NextResponse.json({ error: 'Round 2 already completed' }, { status: 400 })
        }

        const testCases: { input: string; output: string }[] = problem.test_cases || []
        
        if (testCases.length === 0) {
            return NextResponse.json({ error: 'No test cases configured for this problem' }, { status: 500 })
        }

        let passedAll = true
        const resultsArray = []
        let totalTime = 0
        let maxMemory = 0

        // Evaluate all test cases
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i]
            
            try {
                // Execute their submitted code text with STDIN
                const result = await runOnJudge0(code, languageId, tc.input)
                totalTime += parseFloat(result.time || '0')
                maxMemory = Math.max(maxMemory, result.memory || 0)

                const stdout = normalizeOutput(result.stdout)
                const expected = normalizeOutput(tc.output)

                const passed = result.status.id <= 3 && stdout === expected
                
                resultsArray.push({
                    test_num: i + 1,
                    passed,
                    expected,
                    received: stdout,
                    compile_output: result.compile_output,
                    stderr: result.stderr,
                    status_desc: result.status.description
                })

                if (!passed) {
                    passedAll = false
                }
            } catch (e: any) {
                return NextResponse.json({
                    error: 'Execution service temporarily unavailable',
                    details: String(e),
                }, { status: 503 })
            }
        }

        if (passedAll) {
            await completeRound(user.id, 2)
        }

        await logAuditSubmission(user.id, 2, `Ran code for ${problem.title}. Language: ${language}. Passed: ${passedAll}`, ip)

        return NextResponse.json({
            passed: passedAll,
            results: resultsArray,
            execution_time: totalTime.toFixed(3),
            memory_kb: maxMemory,
            attempt: count,
            max_attempts: 15, // Updated limit representation
            message: passedAll ? 'CODE VERIFIED\nENGINEERING SKILL CONFIRMED' : 'TEST FAILED',
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

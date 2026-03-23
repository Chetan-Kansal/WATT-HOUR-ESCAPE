import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, createSupabaseServerClient } from '@/lib/supabase/server'
import { Round2SubmitSchema } from '@/lib/validation/schemas'
import { canAccessRound, completeRound, logIPAddress, logAuditSubmission } from '@/lib/roundLogic'
import { ROUND2_PROBLEMS } from '@/lib/round2/constants'

export const dynamic = 'force-dynamic'

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import vm from 'vm'

// Judge0 language → ID mapping
const LANGUAGE_IDS: Record<string, number> = {
    python: 71,
    javascript: 63,
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
            cpu_time_limit: 5,
            memory_limit: 128000,
            max_processes_and_or_threads: 10,
        }),
    })

    if (!submitRes.ok) throw new Error('Judge0 submission failed')
    const { token } = await submitRes.json()

    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500))
        const resultRes = await fetch(`${JUDGE0_BASE}/submissions/${token}?base64_encoded=false`, {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            },
        })
        const result: Judge0Result & { status: { id: number } } = await resultRes.json()
        if (result.status.id > 2) return result
    }
    throw new Error('Execution timed out')
}

// Fallback for JS that works on Vercel without a Python interpreter
async function runJSInSandbox(code: string): Promise<any> {
    let output = '';
    const sandbox = {
        console: {
            log: (...args: any[]) => {
                output += args.join(' ') + '\n';
            }
        }
    };
    
    try {
        const script = new vm.Script(code);
        const context = vm.createContext(sandbox);
        script.runInContext(context, { timeout: 3000 });
        
        return {
            stdout: output,
            stderr: null,
            status: { id: 3, description: 'Accepted (Cloud JS)' }
        };
    } catch (err: any) {
        return {
            stdout: output,
            stderr: err.message,
            status: { id: 4, description: 'Runtime Error' }
        };
    }
}

// Transpilation shim for simple Python logic (for cloud environments without Python runtime)
async function runPythonInCloud(code: string): Promise<any> {
    // Basic mapping of Python syntax to JS for simple logic-gate type problems
    let jsCode = code
        .replace(/def\s+(\w+)\((.*?)\):/g, 'function $1($2) {')
        .replace(/:(\s*\n)/g, ' {$1')
        .replace(/elif\s+/g, 'else if ')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/and/g, '&&')
        .replace(/or/g, '||')
        .replace(/not\s+/g, '!')
        .replace(/None/g, 'null')
        .replace(/len\((.*?)\)/g, '$1.length')
        .replace(/\.endswith\((.*?)\)/g, '.endsWith($1)')
        .replace(/print\((.*?)\)/g, 'console.log($1)');

    // Very basic brace matching/closing for simple nested structures
    // (This is hacky but sufficient for the 4 specific problems)
    const openBraces = (jsCode.match(/{/g) || []).length;
    const closedBraces = (jsCode.match(/}/g) || []).length;
    if (openBraces > closedBraces) {
        jsCode += '\n' + '}'.repeat(openBraces - closedBraces);
    }

    return runJSInSandbox(jsCode);
}

async function runLocally(code: string, language: string): Promise<any> {
    // For JS on Vercel/Cloud, use the Sandbox instead of child_process
    if (language === 'javascript') {
        return runJSInSandbox(code);
    }

    const tempDir = os.tmpdir();
    const fileName = `submit_${Date.now()}.${language === 'python' ? 'py' : 'js'}`;
    const filePath = path.join(tempDir, fileName);
    
    try {
        fs.writeFileSync(filePath, code);
        
        // Windows uses 'python', Mac/Linux uses 'python3'
        const isWindows = process.platform === 'win32';
        const pythonCmd = isWindows ? 'python' : 'python3';
        const cmd = language === 'python' ? `${pythonCmd} "${filePath}"` : `node "${filePath}"`;
        
        let stdout = '';
        let stderr = '';
        try {
            stdout = execSync(cmd, { timeout: 5000, stdio: 'pipe' }).toString();
        } catch (err: any) {
            // IF Python fails with "command not found", use the Cloud Shim!
            const errorMsg = err.stderr?.toString() || err.message || '';
            if (language === 'python' && (errorMsg.includes('not found') || errorMsg.includes('is not recognized'))) {
                console.log("[Round 2] Python runtime not found. Falling back to Cloud Shim.");
                return runPythonInCloud(code);
            }

            stdout = err.stdout?.toString() || '';
            stderr = errorMsg;
            return {
                stdout,
                stderr,
                status: { id: 4, description: 'Runtime Error' } // 4 = Runtime Error in Judge0
            };
        }
        
        return {
            stdout,
            stderr: null,
            status: { id: 3, description: 'Accepted (Local)' } // 3 = Accepted
        };
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
}

function normalizeOutput(str: string | null): string {
    if (!str) return ''
    
    // Split by newlines and filter out empty lines to find the actual result
    const lines = str.trim().split(/\r?\n/).filter(line => line.trim() !== '');
    const lastLine = lines.length > 0 ? lines[lines.length - 1].trim() : '';
    
    // Normalize numeric-like strings (e.g., "35.0" -> "35")
    return lastLine
      .replace(/\.0+$/, '') 
      .replace(/\.([0-9]*[1-9])0+$/, '.$1')
      .toLowerCase();
}

function isJudge0Enabled() {
    const key = process.env.JUDGE0_API_KEY
    return key && key !== 'your_rapidapi_key_here' && key.length > 10
}

function wrapCode(code: string, language: string, problem: any): string {
    if (language.toLowerCase() === 'python') {
        const funcName = problem.pythonFunction;
        return `${code}\n\nprint(${funcName}(${problem.input}))`;
    } else {
        const funcName = problem.jsFunction;
        return `${code}\n\nconsole.log(${funcName}(${problem.input}))`;
    }
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

    try {
        const supabase = createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const admin = createSupabaseAdmin()
        const { data: team, error: teamError } = await admin.from('teams').select('role').eq('id', user.id).single()
        if (teamError) {
            console.error("Submission: Error fetching team:", teamError)
            return NextResponse.json({ error: 'Failed to verify identity' }, { status: 500 })
        }
        const isAdmin = team?.role === 'admin'

        const canAccess = await canAccessRound(user.id, 2)
        if (!canAccess && !isAdmin) return NextResponse.json({ error: 'Round 1 not completed' }, { status: 403 })

        const body = await req.json()
        const parsed = Round2SubmitSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
        }

        const { problem_id, code, language } = parsed.data
        const languageId = LANGUAGE_IDS[language.toLowerCase()]
        if (!languageId) return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })

        // Get player progress and admin status
        const { data: progress, error: progError } = await admin
            .from('progress')
            .select('round2_problem_index, round2_attempts, round2_completed')
            .eq('team_id', user.id)
            .single()

        if (progError) {
            console.error("Submission: Error fetching progress:", progError)
            return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
        }

        if (progress?.round2_completed) {
            return NextResponse.json({ error: 'Round 2 already completed' }, { status: 400 })
        }

        const currentIndex = progress?.round2_problem_index ?? 0
        const problemIndex = (isAdmin && body.problem_index !== undefined) ? body.problem_index : currentIndex

        console.log(`[Round 2 Submit] Team: ${user.id}, Problem: ${problemIndex}, Current: ${currentIndex}, Admin: ${isAdmin}`)

        if (problemIndex >= ROUND2_PROBLEMS.length) {
            return NextResponse.json({ error: 'Invalid problem index' }, { status: 400 })
        }

        const problem = ROUND2_PROBLEMS[problemIndex]
        const attemptsMap = (progress?.round2_attempts as Record<string, number>) || {}
        const currentAttempts = attemptsMap[problemIndex.toString()] || 0

        // Execute via Judge0 or Mock Mode
        let passed = false
        let result: any = null

        if (isJudge0Enabled()) {
            const wrappedCode = wrapCode(code, language, problem)
            result = await runOnJudge0(wrappedCode, languageId, "") // stdin no longer needed if we wrap
            const stdout = normalizeOutput(result.stdout)
            const expected = normalizeOutput(problem.expectedOutput)

            passed = (result.status.id === 3) && (stdout === expected)
        } else {
            // Mock Mode: Now uses LOCAL EXECUTION
            const wrappedCode = wrapCode(code, language, problem)
            result = await runLocally(wrappedCode, language)
            const stdout = normalizeOutput(result.stdout)
            const expected = normalizeOutput(problem.expectedOutput)

            passed = (result.status.id === 3) && (stdout === expected)
        }

        // Update attempts
        if (!isAdmin) {
            attemptsMap[problemIndex.toString()] = currentAttempts + 1
            const { error: updateError } = await admin.from('progress').update({ round2_attempts: attemptsMap } as never).eq('team_id', user.id)
            if (updateError) console.error("Error updating attempts:", updateError)
        }

        let nextProblemUnlocked = false
        if (passed) {
            // Only increment if they solved the current problem (and were on it)
            if (problemIndex === currentIndex) {
                const newIndex = currentIndex + 1
                const { error: indexError } = await admin.from('progress').update({ round2_problem_index: newIndex } as never).eq('team_id', user.id)
                if (indexError) {
                    console.error("Error updating problem index:", indexError)
                } else {
                    console.log(`[Round 2 Submit] Progress updated to index ${newIndex}`)
                    if (newIndex >= ROUND2_PROBLEMS.length) {
                        await completeRound(user.id, 2)
                    }
                    nextProblemUnlocked = true
                }
            } else if (isAdmin) {
                // For admin testing a specific problem out of order
                nextProblemUnlocked = true
            }
        }

        await logIPAddress(user.id, ip, '/api/round2/submit')
        await logAuditSubmission(user.id, 2, `Problem ${problemIndex}: ${problem.title}. Language: ${language}. Passed: ${passed}`, ip)

        return NextResponse.json({
            passed,
            message: passed ? 'CORRECT! ENGINEERING SKILL CONFIRMED' : 'TEST FAILED',
            stdout: result.stdout,
            expected: problem.expectedOutput,
            stderr: result.stderr,
            compile_output: result.compile_output,
            status_desc: result.status.description,
            current_attempts: isAdmin ? currentAttempts : (currentAttempts + 1),
            max_attempts: 10,
            next_unlocked: nextProblemUnlocked,
            round_complete: (problemIndex >= ROUND2_PROBLEMS.length - 1) && passed
        })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

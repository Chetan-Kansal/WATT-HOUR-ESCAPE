'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Play, AlertTriangle, CheckCircle2, XCircle, Loader2, RefreshCw, Terminal } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface Problem {
    id: string
    title: string
    problem_text: string
    code_snippet: string
    language: string
    test_cases: Array<{ input: string; expected: string }>
    attempts_used: number
    max_attempts: number
}

interface RunResult {
    passed: boolean
    status: string
    stdout: string | null
    stderr: string | null
    compile_output: string | null
    execution_time: string
    attempt: number
    max_attempts: number
    message: string
}

export default function Round2Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [result, setResult] = useState<RunResult | null>(null)

    useEffect(() => {
        fetch('/api/round2/problem', { cache: 'no-store' })
            .then(r => r.json())
            .then(data => {
                setProblem(data)
                setCode(data.code_snippet)
            })
            .catch(() => toast.error('Failed to load problem'))
            .finally(() => setLoading(false))
    }, [])

    const handleSubmit = async () => {
        if (!problem || running) return
        setRunning(true)
        setResult(null)
        try {
            const res = await fetch('/api/round2/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem_id: problem.id, code, language: problem.language }),
            })
            const data: RunResult = await res.json()
            if (!res.ok) {
                toast.error((data as unknown as { error: string }).error || 'Submission failed')
                return
            }
            setResult(data)
            if (data.passed) {
                toast.success('✓ All tests pass! Round 2 complete!')
                setTimeout(() => router.push('/dashboard'), 2000)
            }
        } catch {
            toast.error('Submission failed. Please try again.')
        } finally {
            setRunning(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-primary" />
        </div>
    )

    if (!problem) return (
        <div className="text-center text-muted-foreground py-12">
            <AlertTriangle size={40} className="mx-auto mb-3" />
            <p>Failed to load problem. <button onClick={() => window.location.reload()} className="text-primary hover:underline">Retry</button></p>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Problem Description */}
                <div className="space-y-4">
                    <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-yellow-400" /> {problem.title}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{problem.problem_text}</p>
                    </div>

                    {/* Test Cases */}
                    <div className="glass-card rounded-2xl p-5">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Terminal size={12} /> Test Cases
                        </h3>
                        <div className="space-y-2">
                            {Array.isArray(problem.test_cases) && problem.test_cases.slice(0, 3).map((tc, i) => (
                                <div key={i} className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                                    <div><span className="text-muted-foreground">Input: </span><span className="text-foreground">{tc.input}</span></div>
                                    <div><span className="text-muted-foreground">Expected: </span><span className="text-[#34A853]">{tc.expected}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Attempt counter */}
                    <div className="text-center">
                        <span className={`text-sm ${problem.attempts_used >= 8 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            Attempts: {problem.attempts_used}/{problem.max_attempts}
                        </span>
                    </div>
                </div>

                {/* Editor Panel */}
                <div className="space-y-4">
                    <div className="glass-card rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {problem.language}
                            </span>
                            <button
                                onClick={() => setCode(problem.code_snippet)}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                                <RefreshCw size={12} /> Reset
                            </button>
                        </div>
                        <MonacoEditor
                            height="360px"
                            language={problem.language === 'cpp' ? 'cpp' : problem.language}
                            value={code}
                            onChange={v => setCode(v ?? '')}
                            theme="vs-dark"
                            options={{
                                fontSize: 13,
                                minimap: { enabled: false },
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                padding: { top: 12 },
                                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={running}
                        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-glow-blue"
                    >
                        {running ? <><Loader2 size={18} className="animate-spin" /> Running Tests...</> : <><Play size={18} /> Submit & Run</>}
                    </button>
                </div>
            </div>

            {/* Result Panel */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass-card rounded-2xl p-6 border ${result.passed ? 'border-green-500/30' : 'border-red-500/30'}`}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            {result.passed
                                ? <CheckCircle2 size={22} className="text-green-400" />
                                : <XCircle size={22} className="text-red-400" />}
                            <span className={`font-semibold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>{result.message}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                                {result.execution_time}s · Attempt {result.attempt}/{result.max_attempts}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {result.compile_output && (
                                <div>
                                    <p className="text-xs text-yellow-400 font-mono mb-1">Compilation Output:</p>
                                    <pre className="text-xs bg-muted/50 rounded-lg p-3 font-mono text-foreground/80 overflow-x-auto">{result.compile_output}</pre>
                                </div>
                            )}
                            {result.stdout && (
                                <div>
                                    <p className="text-xs text-[#34A853] font-mono mb-1">stdout:</p>
                                    <pre className="text-xs bg-muted/50 rounded-lg p-3 font-mono text-foreground/80 overflow-x-auto">{result.stdout}</pre>
                                </div>
                            )}
                            {result.stderr && (
                                <div>
                                    <p className="text-xs text-destructive font-mono mb-1">stderr:</p>
                                    <pre className="text-xs bg-muted/50 rounded-lg p-3 font-mono text-destructive/80 overflow-x-auto">{result.stderr}</pre>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

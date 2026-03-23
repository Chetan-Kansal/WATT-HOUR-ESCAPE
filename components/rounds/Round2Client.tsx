'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, RefreshCw, Terminal, Code2, PlayCircle, Cpu, ChevronDown, Lock, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUND2_PROBLEMS } from '@/lib/round2/constants'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface Problem {
    id: number
    title: string
    problem_text: string
    code_snippet: {
        python: string
        javascript: string
    }
    expected_behavior: string
    attempts_used: number
    max_attempts: number
    current_problem_index: number
    total_problems: number
    completed?: boolean
}

interface RunResult {
    passed: boolean
    message: string
    stdout: string | null
    expected: string
    stderr: string | null
    compile_output: string | null
    status_desc: string
    current_attempts: number
    max_attempts: number
    next_unlocked: boolean
    round_complete: boolean
}

const LANGUAGES = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' }
]

export default function Round2Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [selectedLanguage, setSelectedLanguage] = useState('python')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [result, setResult] = useState<RunResult | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)

    const fetchProblem = (index?: number) => {
        setLoading(true)
        const url = index !== undefined ? `/api/round2/problem?index=${index}&t=${Date.now()}` : `/api/round2/problem?t=${Date.now()}`
        fetch(url, { cache: 'no-store' })
            .then(r => r.json())
            .then(data => {
                if (data.completed) {
                    toast.success("Round 2 already completed!")
                    router.push('/dashboard')
                    return
                }
                setProblem(data)
                setCurrentIndex(data.current_problem_index)
                setCode(data.code_snippet[selectedLanguage] || '')
            })
            .catch(() => toast.error('Failed to load problem'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchProblem()
    }, [])

    useEffect(() => {
        if (problem) {
            setCode(problem.code_snippet[selectedLanguage as keyof typeof problem.code_snippet] || '')
        }
    }, [selectedLanguage, problem?.current_problem_index])

    const handleSubmit = async () => {
        if (!problem || running) return
        setRunning(true)
        setResult(null)
        try {
            const res = await fetch('/api/round2/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    problem_id: problem.id, 
                    problem_index: problem.current_problem_index,
                    code, 
                    language: selectedLanguage 
                }),
            })
            const data: RunResult = await res.json()
            if (!res.ok) {
                toast.error((data as any).error || 'Submission failed')
                return
            }
            setResult(data)
            if (data.passed) {
                toast.success('✓ CORRECT!')
                if (data.round_complete) {
                    toast.success('ROUND 2 COMPLETE!')
                    setTimeout(() => router.push('/dashboard'), 2000)
                } else if (data.next_unlocked) {
                    setTimeout(() => {
                        fetchProblem()
                        setResult(null)
                    }, 2500)
                }
            } else {
                toast.error('Test Failed')
                setProblem(prev => prev ? { ...prev, attempts_used: data.current_attempts } : null)
            }
        } catch {
            toast.error('Submission failed. Please try again.')
        } finally {
            setRunning(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64 flex-col gap-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">Initializing Environment...</span>
        </div>
    )

    if (!problem) return null

    return (
        <div className="space-y-6">
            {/* Progress Bar / Steps */}
            <div className="flex items-center justify-between gap-2 px-2 pb-2">
                {ROUND2_PROBLEMS.map((p, idx) => (
                    <div key={idx} className="flex-1 flex items-center gap-2">
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.2)] ${idx < currentIndex ? 'bg-green-500' : idx === currentIndex ? 'bg-green-400 animate-pulse' : 'bg-green-900/20'}`} />
                        {idx < ROUND2_PROBLEMS.length - 1 && <ChevronRight size={14} className="text-green-900/40" />}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between bg-green-950/20 p-3 rounded-lg border border-green-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-green-500/60 uppercase tracking-widest">DECRYPTION_PHASE:</span>
                    <span className="text-sm font-bold font-mono text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">BLOCK_{currentIndex + 1}: {problem.title.toUpperCase()}</span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 h-[auto] md:h-[550px]">
                {/* Left: Description */}
                <div className="flex flex-col gap-4 h-full">
                    <div className="glass-card rounded-xl border border-border/50 flex-1 flex flex-col overflow-hidden bg-muted/5">
                        <div className="bg-green-950/40 border-b border-green-500/20 px-4 py-2 flex items-center gap-2 relative">
                            <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none" />
                            <Terminal size={16} className="text-green-500" />
                            <span className="text-xs font-bold text-green-400 uppercase tracking-[0.2em] font-mono">KERNEL_BRIEFING</span>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-sans">
                                {problem.problem_text}
                            </p>
                            <div className="space-y-4">
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Expected Behavior</h4>
                                    <p className="text-xs text-foreground/80 font-mono italic">{problem.expected_behavior}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Test Results Terminal (Simplified) */}
                    <div className="glass-card rounded-xl border border-border/50 bg-[#0A0A0A] h-[180px] flex flex-col">
                        <div className="bg-[#111] border-b border-[#333] px-4 py-2 flex items-center gap-2">
                            <Terminal size={14} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Output Log_</span>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] space-y-2">
                            {result ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        {result.passed ? <CheckCircle2 size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                                        <span className={result.passed ? 'text-green-400' : 'text-red-400'}>{result.message}</span>
                                    </div>
                                    {!result.passed && (
                                        <>
                                            <div className="text-muted-foreground mt-2 border-t border-white/5 pt-2">Details:</div>
                                            <div className="text-red-300">Expected: {result.expected}</div>
                                            <div className="text-red-400">Received: {result.stdout || 'None'}</div>
                                            {result.stderr && <div className="text-red-500 overflow-hidden text-ellipsis italic opacity-70">Stderr: {result.stderr}</div>}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-muted-foreground/30 animate-pulse italic">Waiting for execution...</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Editor */}
                <div className="flex flex-col h-full gap-4">
                    <div className="glass-card rounded-xl border border-border/50 flex-1 flex flex-col overflow-hidden bg-[#1E1E1E]">
                        <div className="bg-[#2D2D2D] border-b border-[#111] px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <select
                                        value={selectedLanguage}
                                        onChange={(e) => setSelectedLanguage(e.target.value)}
                                        className="appearance-none bg-[#1E1E1E] border border-[#444] text-[#CCCCCC] text-xs font-mono py-1 pl-3 pr-8 rounded focus:outline-none focus:border-primary cursor-pointer transition-colors"
                                    >
                                        {LANGUAGES.map(lang => (
                                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <button
                                onClick={() => setCode(problem.code_snippet[selectedLanguage as keyof typeof problem.code_snippet] || '')}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-mono uppercase"
                            >
                                <RefreshCw size={12} /> Reset Code
                            </button>
                        </div>
                        
                        <div className="flex-1 relative">
                            <MonacoEditor
                                language={selectedLanguage === 'javascript' ? 'javascript' : 'python'}
                                value={code}
                                onChange={v => setCode(v ?? '')}
                                theme="vs-dark"
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16 },
                                    fontFamily: 'JetBrains Mono, monospace',
                                    renderLineHighlight: 'all',
                                    cursorBlinking: 'smooth',
                                }}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={running}
                        className="w-full h-14 flex-shrink-0 bg-green-600 text-black rounded-xl font-mono text-sm uppercase tracking-[0.3em] font-black hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]"
                    >
                        {running ? (
                            <><Cpu size={20} className="animate-spin" /> <span>BYPASSING_FIREWALL...</span></>
                        ) : (
                            <><PlayCircle size={20} /> <span>EXECUTE_PAYLOAD</span></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

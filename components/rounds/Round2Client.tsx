'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Play, AlertTriangle, CheckCircle2, XCircle, Loader2, RefreshCw, Terminal, Code2, PlayCircle, Cpu, ChevronDown } from 'lucide-react'
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
    results: Array<{
        test_num: number
        passed: boolean
        expected: string
        received: string
        compile_output: string | null
        stderr: string | null
        status_desc: string
    }>
    execution_time: string
    attempt: number
    max_attempts: number
    message: string
}

const STARTER_CODES: Record<string, string> = {
    python: `def sum_n(n):\n    total = 0\n    for i in range(1,n):\n        total += i\n    return total`,
    javascript: `function sum_n(n){\n let total = 0\n for(let i=1;i<n;i++){\n  total += i\n }\n return total\n}`,
    java: `public static int sum_n(int n){\n int total = 0;\n for(int i=1;i<n;i++){\n  total += i;\n }\n return total;\n}`,
    cpp: `int sum_n(int n){\n int total = 0;\n for(int i=1;i<n;i++){\n  total += i;\n }\n return total;\n}`,
    c: `int sum_n(int n){\n int total = 0;\n for(int i=1;i<n;i++){\n  total += i;\n }\n return total;\n}`
}

const SUPPORTED_LANGUAGES = [
    { id: 'python', name: 'Python' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'java', name: 'Java' },
    { id: 'cpp', name: 'C++' },
    { id: 'c', name: 'C' }
]

export default function Round2Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [selectedLanguage, setSelectedLanguage] = useState('python')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [result, setResult] = useState<RunResult | null>(null)

    useEffect(() => {
        fetch('/api/round2/problem', { cache: 'no-store' })
            .then(r => r.json())
            .then(data => {
                setProblem(data)
                const defaultLang = data.language?.toLowerCase() || 'python'
                setSelectedLanguage(defaultLang)
                setCode(STARTER_CODES[defaultLang] || data.code_snippet || '')
            })
            .catch(() => toast.error('Failed to load problem'))
            .finally(() => setLoading(false))
    }, [])

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = e.target.value
        setSelectedLanguage(lang)
        setCode(STARTER_CODES[lang] || '')
    }

    const handleSubmit = async () => {
        if (!problem || running) return
        setRunning(true)
        setResult(null)
        try {
            const res = await fetch('/api/round2/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem_id: problem.id, code, language: selectedLanguage }),
            })
            const data: RunResult = await res.json()
            if (!res.ok) {
                toast.error((data as unknown as { error: string }).error || 'Submission failed')
                return
            }
            setResult(data)
            if (data.passed) {
                toast.success('✓ BUILD SUCCESS! Round 2 complete!')
                setTimeout(() => router.push('/dashboard'), 2000)
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

    if (!problem) return (
        <div className="text-center text-muted-foreground py-12">
            <AlertTriangle size={40} className="mx-auto mb-3" />
            <p>Failed to load problem. <button onClick={() => window.location.reload()} className="text-primary hover:underline">Retry</button></p>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4 h-[auto] md:h-[600px]">
                {/* Problem Description Pane */}
                <div className="flex flex-col gap-4 h-full">
                    <div className="glass-card rounded-xl border border-border/50 flex-1 flex flex-col overflow-hidden">
                        {/* Pane Header */}
                        <div className="bg-muted/30 border-b border-border/50 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code2 size={16} className="text-primary" />
                                <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Problem Description</span>
                            </div>
                        </div>
                        
                        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                {problem.title}
                            </h2>
                            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground">
                                <p className="whitespace-pre-wrap leading-relaxed font-sans">{problem.problem_text}</p>
                            </div>
                        </div>
                    </div>

                    {/* Test Cases Terminal */}
                    <div className="glass-card rounded-xl border border-border/50 bg-[#0A0A0A] flex-shrink-0">
                        <div className="bg-[#111] border-b border-[#333] px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Test Cases_</span>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${problem.attempts_used >= problem.max_attempts - 1 ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
                                ATTEMPTS: {problem.attempts_used}/{problem.max_attempts}
                            </span>
                        </div>
                        <div className="p-4 space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar-dark">
                            {Array.isArray(problem.test_cases) && problem.test_cases.slice(0, 3).map((tc, i) => (
                                <div key={i} className="font-mono text-[11px] leading-relaxed">
                                    <div className="flex"><span className="text-muted-foreground w-16 select-none border-r border-[#333] mr-2 pr-2 text-right">IN</span><span className="text-blue-300 break-all whitespace-pre-wrap">{tc.input}</span></div>
                                    <div className="flex"><span className="text-muted-foreground w-16 select-none border-r border-[#333] mr-2 pr-2 text-right">OUT</span><span className="text-green-400 break-all whitespace-pre-wrap">{tc.expected}</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Editor Panel Pane */}
                <div className="flex flex-col h-full gap-4">
                    <div className="glass-card rounded-xl border border-border/50 flex-1 flex flex-col overflow-hidden bg-[#1E1E1E]">
                        {/* Editor Header (macOS style + Language Selector) */}
                        <div className="bg-[#2D2D2D] border-b border-[#111] px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Traffic lights */}
                                <div className="flex gap-1.5 hidden sm:flex">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedLanguage}
                                        onChange={handleLanguageChange}
                                        className="appearance-none bg-[#1E1E1E] border border-[#444] text-[#CCCCCC] text-xs font-mono py-1 pl-3 pr-8 rounded focus:outline-none focus:border-primary transition-colors cursor-pointer"
                                    >
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <button
                                onClick={() => setCode(STARTER_CODES[selectedLanguage] || '')}
                                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-mono uppercase"
                                title="Reset to standard starter code"
                            >
                                <RefreshCw size={12} /> Reset
                            </button>
                        </div>
                        
                        <div className="flex-1 relative">
                            <MonacoEditor
                                language={selectedLanguage === 'cpp' || selectedLanguage === 'c' ? 'cpp' : selectedLanguage}
                                value={code}
                                onChange={v => setCode(v ?? '')}
                                theme="vs-dark"
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16 },
                                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                                    renderLineHighlight: 'all',
                                    smoothScrolling: true,
                                    cursorBlinking: 'smooth',
                                    cursorSmoothCaretAnimation: 'on',
                                }}
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={running}
                        className="w-full h-12 flex-shrink-0 bg-primary/90 text-primary-foreground rounded-xl font-mono text-sm uppercase tracking-widest font-bold hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-glow-blue relative overflow-hidden group"
                    >
                        {/* Glitch effect layer */}
                        <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
                        
                        {running ? (
                            <><Cpu size={18} className="animate-spin" /> <span>Compiling...</span></>
                        ) : (
                            <><PlayCircle size={18} /> <span>Execute & Submit</span></>
                        )}
                    </button>
                </div>
            </div>

            {/* Results Console Terminal */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`rounded-xl border bg-[#0A0A0A] overflow-hidden ${result.passed ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]'}`}
                    >
                        <div className={`px-4 py-2 border-b font-mono text-[13px] flex flex-col md:flex-row md:items-center justify-between gap-2
                            ${result.passed ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}
                        `}>
                            <div className="flex items-center gap-2">
                                {result.passed ? <CheckCircle2 size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
                                <span className={`${result.passed ? 'text-green-400' : 'text-red-400'} font-bold uppercase tracking-wider whitespace-pre-wrap leading-tight`}>
                                    {result.message}
                                </span>
                            </div>
                            <div className="flex gap-4 text-muted-foreground text-xs justify-end">
                                <span>EXEC: {result.execution_time}s</span>
                                <span>ATTEMPT: {result.attempt}/{result.max_attempts}</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-6 font-mono text-[13px] leading-relaxed">
                            {/* Array of Test Results */}
                            {result.results?.map((tcRes, idx) => (
                                <div key={idx} className="space-y-3">
                                    <p className={`${tcRes.passed ? 'text-green-400' : 'text-red-400'} font-bold tracking-widest uppercase`}>
                                        TEST {tcRes.test_num} {tcRes.passed ? 'PASSED' : 'FAILED'}
                                    </p>
                                    
                                    {!tcRes.passed && (
                                        <div className="space-y-3 text-[12px] opacity-90 pl-2 border-l-2 border-[#333]">
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground block text-[10px] tracking-wider uppercase">EXPECTED:</span>
                                                <span className="text-green-400 block break-all whitespace-pre-wrap font-bold">{tcRes.expected}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground block text-[10px] tracking-wider uppercase">RECEIVED:</span>
                                                <span className="text-red-400 block break-all whitespace-pre-wrap font-bold">{tcRes.received || 'No Output or Execution Error'}</span>
                                            </div>
                                            {tcRes.stderr && (
                                              <div className="space-y-1 mt-2">
                                                <span className="text-red-500/70 block text-[10px] tracking-wider uppercase">stderr:</span>
                                                <span className="text-red-400 block whitespace-pre-wrap break-all">{tcRes.stderr}</span>
                                              </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

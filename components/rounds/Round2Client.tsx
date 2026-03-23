'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Terminal, Cpu, Activity, ShieldAlert, KeyRound, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { TerminalProblem } from '@/lib/round2/constants'

interface ProblemData extends TerminalProblem {
    current_problem_index: number;
    total_problems: number;
}

export default function Round2Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<ProblemData | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    
    const [answer, setAnswer] = useState('')
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const fetchStatus = () => {
        setLoading(true)
        fetch('/api/round2/problem')
            .then(r => r.json())
            .then(data => {
                if (data.completed) {
                    router.push('/dashboard')
                    return
                }
                setProblem(data)
                setCurrentIndex(data.current_problem_index)
            })
            .catch(() => toast.error('Failed to initialize uplink'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchStatus()
    }, [])
    
    // Auto-focus the terminal input when a problem loads
    useEffect(() => {
        if (problem && inputRef.current) {
            inputRef.current.focus()
        }
    }, [problem])

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!answer.trim() || submitting) return
        
        setSubmitting(true)
        setStatusMessage(null)
        try {
            const res = await fetch('/api/round2/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem_id: problem?.id,
                    answer: answer
                })
            })
            
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                if (data.isRoundComplete) {
                    setTimeout(() => router.push('/dashboard'), 2000)
                } else {
                    setAnswer('')
                    setStatusMessage('OVERRIDE_SUCCESS')
                    setTimeout(() => {
                        setStatusMessage(null)
                        fetchStatus()
                    }, 1000)
                }
            } else {
                setStatusMessage(data.details || 'LOGIC_MISMATCH_DETECTED')
                toast.error(data.message)
                if (inputRef.current) inputRef.current.focus()
            }
        } catch (err) {
            toast.error('Uplink Interrupted')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading && !problem) return (
        <div className="flex items-center justify-center h-64 flex-col gap-4">
            <Loader2 size={32} className="animate-spin text-green-500" />
            <span className="text-[10px] font-mono text-green-500/60 tracking-[0.3em] uppercase animate-pulse">Establishing Logic Uplink...</span>
        </div>
    )

    if (!problem) return null

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-4 lg:px-0">
            {/* Header: Status Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-black/40 p-4 rounded-xl border border-green-500/20 backdrop-blur-md relative overflow-hidden gap-4">
                <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-green-500/60 uppercase tracking-widest">Sector_Safety_Audit</span>
                    </div>
                    <div className="h-4 w-px bg-green-500/20 hidden md:block" />
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold font-mono text-green-400">UNIT_{currentIndex + 1}: {problem.title.toUpperCase()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative z-10 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {Array.from({ length: problem.total_problems }).map((_, idx) => (
                        <div key={idx} className={`h-1 w-8 shrink-0 rounded-full transition-all duration-500 ${idx < currentIndex ? 'bg-green-500' : idx === currentIndex ? 'bg-green-400 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-green-900/30'}`} />
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                
                {/* Left: Mission Briefing (Col 4) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-blue-950/10 border border-blue-500/20 rounded-xl p-5 backdrop-blur-sm relative h-full flex flex-col">
                        <div className="absolute top-0 right-0 p-3">
                            <ShieldAlert size={18} className="text-blue-500/40" />
                        </div>
                        <h4 className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Terminal size={12} /> Analysis_Brief
                        </h4>
                        
                        <div className="flex-1 space-y-4">
                            <p className="text-sm text-blue-100/80 leading-relaxed font-sans">
                                {problem.description}
                            </p>
                            
                            <div className="p-4 bg-black/40 rounded-lg border border-blue-500/10 mt-6">
                                <h5 className="text-[10px] font-mono text-blue-500/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <KeyRound size={12} /> Objective
                                </h5>
                                <p className="text-xs text-blue-300/80 font-mono leading-relaxed">
                                    The code module to the right is missing a critical sequence identified by <span className="text-yellow-400 border border-yellow-400/30 px-1 rounded bg-yellow-400/10">____</span>.
                                    <br /><br />
                                    Identify the missing exact keyword or operator and inject it via the terminal below to clear the anomaly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Code & Terminal (Col 8) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    
                    {/* Code Display */}
                    <div className="bg-[#0D1117] rounded-xl border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
                        <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white/70 font-mono tracking-widest uppercase">{problem.language}_MODULE</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                            </div>
                        </div>

                        <div className="p-6 font-mono text-sm md:text-base overflow-x-auto text-blue-100/90 leading-relaxed custom-scrollbar relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_100%)] pointer-events-none" />
                            <pre className="relative z-10">
                                <code>
                                    {problem.codeSnippet.split('____').map((part, i, arr) => (
                                        <span key={i}>
                                            {part}
                                            {i < arr.length - 1 && (
                                                <span className="text-yellow-400 animate-pulse border-b-2 border-yellow-400">____</span>
                                            )}
                                        </span>
                                    ))}
                                </code>
                            </pre>
                        </div>
                    </div>

                    {/* Interactive Retro Terminal */}
                    <div className="bg-[#050505] rounded-xl border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)] overflow-hidden relative group transition-all duration-300 focus-within:border-green-400 focus-within:shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        {/* Terminal Header */}
                        <div className="bg-[#111] border-b border-green-500/20 px-4 py-1.5 flex justify-between items-center">
                            <span className="text-[10px] font-mono text-green-500/50">SYSTEM_OVERRIDE_TERMINAL</span>
                            <span className="text-[10px] font-mono text-green-500/30">AWAITING_INPUT</span>
                        </div>
                        
                        <div className="p-4 md:p-6">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                
                                <div className="flex items-center gap-3">
                                    <span className="text-green-500 font-mono text-lg font-bold shrink-0">root@sys:~#</span>
                                    <div className="relative flex-1">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            disabled={submitting || statusMessage === 'OVERRIDE_SUCCESS'}
                                            autoComplete="off"
                                            spellCheck="false"
                                            className="w-full bg-transparent border-none outline-none text-green-400 font-mono text-lg md:text-xl placeholder:text-green-900 disabled:opacity-50"
                                            placeholder="enter_missing_keyword"
                                        />
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                                            {submitting && <Loader2 size={18} className="text-green-500 animate-spin" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Feedback */}
                                <AnimatePresence mode="wait">
                                    {statusMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className={`mt-2 p-3 text-xs font-mono flex items-start gap-2 border-l-2 ${statusMessage === 'OVERRIDE_SUCCESS' ? 'text-green-400 border-green-400 bg-green-500/10' : 'text-red-400 border-red-500 bg-red-500/10'}`}>
                                                {statusMessage === 'OVERRIDE_SUCCESS' ? <CheckCircle2 size={14} className="mt-0.5" /> : <XCircle size={14} className="mt-0.5" />}
                                                <span>{statusMessage}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={!answer.trim() || submitting || statusMessage === 'OVERRIDE_SUCCESS'}
                                    className="hidden" // Hidden button to allow ENTER key submission natively
                                >
                                    Submit
                                </button>
                            </form>
                        </div>
                        
                        {/* Scanline effect entirely in CSS */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-20"></div>
                    </div>
                    
                    <button
                        onClick={handleSubmit}
                        disabled={!answer.trim() || submitting || statusMessage === 'OVERRIDE_SUCCESS'}
                        className={`w-full h-14 rounded-xl font-mono text-sm uppercase tracking-[0.4em] font-black transition-all flex items-center justify-center gap-4 relative overflow-hidden ${answer.trim() && !submitting ? 'bg-green-600 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-500 hover:scale-[1.01]' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'}`}
                    >
                        {submitting ? (
                            <><Loader2 size={20} className="animate-spin" /> EXECUTING...</>
                        ) : (
                            <><Cpu size={20} /> <span>INJECT_PAYLOAD</span></>
                        )}
                    </button>
                    
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(59, 130, 246, 0.2);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.4);
                }
            `}</style>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, Terminal, Cpu, ChevronRight, Activity, ShieldAlert, CpuIcon, ScanLine, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { ROUND2_PROBLEMS } from '@/lib/round2/constants'

interface ProblemData {
    id: number;
    title: string;
    description: string;
    codeLines: string[];
    language: string;
    fixes: string[];
    expectedBehavior: string;
    current_problem_index: number;
    total_problems: number;
}

export default function Round2Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<ProblemData | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedLine, setSelectedLine] = useState<number | null>(null)
    const [selectedFix, setSelectedFix] = useState<number | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [scanPulse, setScanPulse] = useState(0)

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
        const interval = setInterval(() => setScanPulse(p => (p + 1) % 100), 50)
        return () => clearInterval(interval)
    }, [])

    const handleSubmit = async () => {
        if (selectedLine === null || selectedFix === null || submitting) return
        
        setSubmitting(true)
        try {
            const res = await fetch('/api/round2/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem_id: problem?.id,
                    selected_line: selectedLine,
                    selected_fix: selectedFix
                })
            })
            
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                if (data.isRoundComplete) {
                    setTimeout(() => router.push('/dashboard'), 2000)
                } else {
                    setSelectedLine(null)
                    setSelectedFix(null)
                    setStatusMessage(null)
                    fetchStatus()
                }
            } else {
                setStatusMessage(data.details || 'LOGIC_MISMATCH_DETECTED')
                toast.error(data.message)
            }
        } catch (err) {
            toast.error('Uplink Interrupted')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64 flex-col gap-4">
            <Loader2 size={32} className="animate-spin text-green-500" />
            <span className="text-[10px] font-mono text-green-500/60 tracking-[0.3em] uppercase animate-pulse">Establishing Logic Uplink...</span>
        </div>
    )

    if (!problem) return null

    const codeLines = problem.codeLines

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4 lg:px-0">
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
                        <div key={idx} className={`h-1 w-8 shrink-0 rounded-full transition-all duration-500 ${idx < currentIndex ? 'bg-green-500' : idx === currentIndex ? 'bg-green-400 animate-pulse' : 'bg-green-900/30'}`} />
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
                {/* Left: Code Inspection (Col 7) */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-[#0D1117] rounded-xl border border-white/5 overflow-hidden flex flex-col h-[450px] md:h-[600px] shadow-2xl relative group">
                        {/* Scanning HUD Overlay */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.5)] z-20 pointer-events-none transition-all duration-[2000ms] ease-linear" style={{ top: `${scanPulse}%` }} />
                        
                        <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ScanLine size={16} className="text-green-500" />
                                <span className="text-xs font-bold text-white/70 font-mono tracking-widest">LOGIC_FLOW_ANALYSIS</span>
                            </div>
                            <span className="text-[10px] font-mono text-green-500/40">{problem.language.toUpperCase()}_KERNEL v2.5</span>
                        </div>

                        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 font-mono text-[12px] md:text-sm custom-scrollbar bg-[#010409]">
                            {codeLines.map((line, idx) => (
                                <motion.div
                                    key={idx}
                                    onClick={() => { setSelectedLine(idx); setStatusMessage(null); }}
                                    className={`group flex items-start gap-4 cursor-pointer rounded px-2 py-1 transition-all relative min-w-max ${selectedLine === idx ? 'bg-green-500/10 border-l-2 border-green-500' : 'hover:bg-white/5'}`}
                                    whileHover={{ x: 4 }}
                                >
                                    <span className={`w-8 text-right text-xs shrink-0 select-none ${selectedLine === idx ? 'text-green-500 font-bold' : 'text-white/20'}`}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <span className={`whitespace-pre ${selectedLine === idx ? 'text-green-400' : 'text-blue-100/80 group-hover:text-white'}`}>
                                        {line || ' '}
                                    </span>
                                    {selectedLine === idx && (
                                        <motion.div layoutId="selector" className="absolute inset-0 bg-green-500/5 pointer-events-none" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <p className="text-[10px] font-mono text-white/30 text-center uppercase tracking-[0.2em]">Select the line where the logic leak is occurring</p>
                </div>

                {/* Right: Repair Station (Col 5) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Mission Brief */}
                    <div className="bg-blue-950/10 border border-blue-500/20 rounded-xl p-5 backdrop-blur-sm relative">
                        <div className="absolute top-0 right-0 p-3">
                            <ShieldAlert size={18} className="text-blue-500/40" />
                        </div>
                        <h4 className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Terminal size={12} /> Analysis_Brief
                        </h4>
                        <p className="text-sm text-blue-100/70 leading-relaxed font-sans mb-4">
                            {problem.description}
                        </p>
                        <div className="p-3 bg-blue-500/5 rounded border border-blue-500/10 italic text-[11px] text-blue-300/80">
                            Target Output: {problem.expectedBehavior}
                        </div>
                    </div>

                    {/* Repair Modules */}
                    <div className={`space-y-4 transition-all duration-500 ${selectedLine !== null ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-4'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Wrench size={14} className="text-green-500" />
                            <span className="text-xs font-bold text-white/70 font-mono tracking-widest uppercase">Select Repair Module</span>
                        </div>
                        
                        <div className="grid gap-3">
                            {problem.fixes.map((fix, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedFix(idx)}
                                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${selectedFix === idx ? 'bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-[10px] font-bold ${selectedFix === idx ? 'bg-green-500 border-green-500 text-black' : 'border-white/20 text-white/40'}`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <code className={`text-xs break-all ${selectedFix === idx ? 'text-green-400' : 'text-white/60 group-hover:text-white/80'}`}>
                                            {fix}
                                        </code>
                                    </div>
                                    {selectedFix === idx && (
                                        <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Feedback */}
                    <AnimatePresence mode="wait">
                        {statusMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                            >
                                <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest">Diagnostic_Warning</span>
                                    <p className="text-xs text-red-200/70 font-mono leading-tight">{statusMessage}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={selectedLine === null || selectedFix === null || submitting}
                        className={`w-full h-16 rounded-xl font-mono text-sm uppercase tracking-[0.4em] font-black transition-all flex items-center justify-center gap-4 relative overflow-hidden ${selectedLine !== null && selectedFix !== null ? 'bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-[1.02] active:scale-95' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'}`}
                    >
                        {submitting ? (
                            <><Loader2 size={24} className="animate-spin" /> APPROVING_REPAIR...</>
                        ) : (
                            <><CpuIcon size={24} /> <span>INITIALIZE_REPAIR</span></>
                        )}
                        {selectedLine !== null && selectedFix !== null && !submitting && (
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                        )}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(34, 197, 94, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(34, 197, 94, 0.3);
                }
            `}</style>
        </div>
    )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, Loader2, Zap, Activity, Send, Lock, Unlock, HelpCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface PuzzleData {
    id: number;
    coreNumber: number;
    title: string;
    type: 'debug' | 'sequence' | 'logic_gate' | 'binary' | 'anagram' | 'cipher' | 'base_convert';
    description: string;
    displayData: string;
    hint: string | null;
    choices: string[] | null;
    current_problem_index: number;
    total_problems: number;
    warning?: string;
}

const CORE_COLORS = [
    { primary: '#22c55e', glow: 'rgba(34,197,94,0.4)', bg: 'rgba(34,197,94,0.08)' }, // Green
    { primary: '#3b82f6', glow: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.08)' }, // Blue
    { primary: '#a855f7', glow: 'rgba(168,85,247,0.4)', bg: 'rgba(168,85,247,0.08)' }, // Purple
    { primary: '#f43f5e', glow: 'rgba(244,63,94,0.4)', bg: 'rgba(244,63,94,0.08)' },  // Rose
    { primary: '#f59e0b', glow: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.08)' }, // Amber
]

const TYPE_LABELS: Record<string, string> = {
    debug: 'CODE_INSPECTION',
    sequence: 'PATTERN_ANALYSIS',
    logic_gate: 'GATE_IDENTIFICATION',
    binary: 'SIGNAL_DECRYPTION',
    anagram: 'DATA_RECOVERY',
    cipher: 'CIPHER_DECRYPTION',
    base_convert: 'BASE_CONVERSION',
}

export default function Round2Client() {
    const router = useRouter()
    const [puzzle, setPuzzle] = useState<PuzzleData | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [answer, setAnswer] = useState('')
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const [showHint, setShowHint] = useState(false)
    const [shakeCount, setShakeCount] = useState(0)

    const fetchPuzzle = () => {
        setLoading(true)
        fetch('/api/round2/problem')
            .then(r => r.json())
            .then(data => {
                if (data.completed) {
                    router.push('/dashboard')
                    return
                }
                setPuzzle(data)
                setAnswer('')
                setStatusMessage(null)
                setShowHint(false)
            })
            .catch(() => toast.error('Failed to connect to reactor'))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchPuzzle()
    }, [])

    const handleSubmit = async () => {
        if (!answer.trim() || submitting) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/round2/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem_id: puzzle?.id, answer: answer.trim() })
            })

            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                if (data.isRoundComplete) {
                    setTimeout(() => router.push('/dashboard'), 2500)
                } else {
                    fetchPuzzle()
                }
            } else {
                setStatusMessage(data.details || 'Incorrect answer.')
                setShakeCount(v => v + 1)
                toast.error(data.message)
            }
        } catch {
            toast.error('Uplink interrupted')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-screen flex-col gap-6 bg-[#010409]">
             <div className="relative">
                <Loader2 size={48} className="animate-spin text-green-500" />
                <div className="absolute inset-0 blur-xl bg-green-500/20 animate-pulse" />
             </div>
            <span className="text-[12px] font-mono text-green-500/80 tracking-[0.5em] uppercase animate-pulse">Synchronizing Core Array...</span>
        </div>
    )

    if (!puzzle) return null

    const coreIdx = puzzle.current_problem_index
    const colors = CORE_COLORS[coreIdx % CORE_COLORS.length]

    return (
        <div className="min-h-screen bg-[#010101] text-white/90 p-4 lg:p-10 font-sans selection:bg-white/10 overflow-hidden relative">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ background: colors.primary }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px]" style={{ background: colors.primary }} />
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: colors.primary }} />
                             <span className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-50">System_Status: Operational</span>
                        </div>
                        <h1 className="text-4xl font-black italic tracking-tighter flex items-center gap-3 relative group">
                            <span className="relative">
                                SEQUENCE
                                <span className="absolute inset-0 text-red-500 opacity-0 group-hover:opacity-100 group-hover:animate-pulse blur-sm -z-10">SEQUENCE</span>
                            </span>
                            <span style={{ color: colors.primary }} className="animate-pulse">REACTOR</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xl">
                        {Array.from({ length: puzzle.total_problems }).map((_, idx) => (
                            <div key={idx} className="relative group">
                                <motion.div
                                    animate={idx === coreIdx ? { 
                                        scale: [1, 1.1, 1],
                                        boxShadow: [`0 0 0px transparent`, `0 0 20px ${colors.glow}`, `0 0 0px transparent`]
                                    } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-500 overflow-hidden ${
                                        idx < coreIdx ? 'bg-green-500/20 border-green-500 shadow-lg shadow-green-500/20' : 
                                        idx === coreIdx ? 'border-current' : 'border-white/10 bg-white/5 opacity-50'
                                    }`}
                                    style={idx === coreIdx ? { color: colors.primary, borderColor: colors.primary } : {}}
                                >
                                    {idx < coreIdx ? <Unlock size={20} className="text-green-500" /> : <Lock size={18} />}
                                    {idx === coreIdx && <div className="absolute inset-0 bg-current opacity-10 blur-md" />}
                                </motion.div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono opacity-50">CORE_{idx+1}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Mission Control Panel (Left) */}
                    <div className="lg:col-span-5 space-y-6">
                        <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="p-8 rounded-[2rem] border relative overflow-hidden backdrop-blur-3xl h-full flex flex-col group"
                            style={{ borderColor: `${colors.primary}33`, background: `linear-gradient(135deg, ${colors.bg}, transparent)` }}
                        >
                            {/* Alert Overlay for High Stakes */}
                            {puzzle.warning && (
                                <div className="absolute top-0 left-0 w-full overflow-hidden h-6 bg-red-600/20 flex items-center">
                                    <div className="whitespace-nowrap animate-[marquee_10s_linear_infinite] text-[8px] font-mono font-bold text-red-400 opacity-60">
                                        {Array(10).fill(puzzle.warning).join('  ///  ')}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-6 mt-4">
                                <div className="p-2 rounded-lg" style={{ background: `${colors.primary}22` }}>
                                    <Activity size={16} style={{ color: colors.primary }} />
                                </div>
                                <span className="text-xs font-mono font-bold uppercase tracking-[0.2em]" style={{ color: colors.primary }}>
                                    {TYPE_LABELS[puzzle.type]}
                                </span>
                            </div>

                            <h2 className="text-3xl font-bold mb-4 tracking-tight relative">
                                {puzzle.title}
                                <span className="absolute inset-0 text-cyan-500 opacity-0 group-hover:opacity-40 blur-md pointer-events-none">{puzzle.title}</span>
                            </h2>
                            <p className="text-lg text-white/60 leading-relaxed mb-8 font-serif italic">
                                "{puzzle.description}"
                            </p>

                            <div className="mt-auto space-y-4">
                                {puzzle.hint && (
                                    <div className="relative">
                                        <button 
                                            onClick={() => setShowHint(!showHint)}
                                            className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-3 rounded-xl transition-all"
                                        >
                                            <HelpCircle size={14} style={{ color: colors.primary }} />
                                            {showHint ? 'Hide Hint' : 'Request Diagnostic'}
                                        </button>
                                        <AnimatePresence>
                                            {showHint && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="mt-3 p-4 bg-black/40 border border-white/10 rounded-2xl text-sm italic text-white/50 leading-relaxed"
                                                >
                                                    {puzzle.hint}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                <AnimatePresence mode="wait">
                                    {statusMessage && (
                                        <motion.div 
                                            key={shakeCount}
                                            initial={{ x: -10 }}
                                            animate={{ x: [0, -10, 10, -10, 10, 0] }}
                                            className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4"
                                        >
                                            <AlertCircle size={20} className="text-red-400 shrink-0" />
                                            <div>
                                                <div className="text-xs font-bold font-mono text-red-400 uppercase tracking-widest mb-1">Authorization_Failed</div>
                                                <p className="text-sm text-red-200/60 leading-tight">{statusMessage}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>

                    {/* Interaction Panel (Right) */}
                    <div className="lg:col-span-7 space-y-6 flex flex-col">
                        <motion.div
                            key={puzzle.id}
                            initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
                            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="bg-[#0D1117]/80 rounded-[2.5rem] border overflow-hidden flex-1 flex flex-col relative min-h-[350px]"
                            style={{ borderColor: `${colors.primary}44`, boxShadow: `0 30px 60px -12px rgba(0,0,0,0.5), 0 0 20px -5px ${colors.glow}` }}
                        >
                            {/* Glass Reflections */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-px bg-white/20" />
                                <div className="absolute bottom-0 left-0 w-full h-px bg-white/5" />
                                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-white/10 to-transparent" />
                            </div>

                            <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.primary }} />
                                    <span className="text-[10px] font-mono tracking-[0.4em] opacity-40 uppercase">Processor_Uplink</span>
                                </div>
                                <span className="text-[10px] font-mono opacity-20">ENCRYPT_LEVEL_B4</span>
                            </div>

                            <div className="flex-1 flex items-center justify-center p-6 md:p-10">
                                {puzzle.type === 'debug' ? (
                                    <div className="w-full bg-black/60 p-6 rounded-2xl border border-white/5 font-mono text-sm md:text-base leading-relaxed overflow-x-auto shadow-2xl">
                                        {puzzle.displayData.split('\n').map((line, lIdx) => (
                                            <div key={lIdx} className="flex gap-4 group">
                                                <span className="opacity-20 select-none w-6 text-right group-hover:opacity-40 transition-opacity">{lIdx + 1}</span>
                                                <span className="text-white/80 whitespace-pre scrollbar-hide">{line.includes(': ') ? line.split(': ')[1] : line}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : puzzle.type === 'logic_gate' ? (
                                    <div className="w-full max-w-sm bg-black/40 p-6 rounded-3xl border border-white/5">
                                        <table className="w-full font-mono text-base">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="pb-4 opacity-30">A</th>
                                                    <th className="pb-4 opacity-30">B</th>
                                                    <th className="pb-4 font-black" style={{ color: colors.primary }}>OUT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {puzzle.displayData.split('\n').map((row, rIdx) => {
                                                    const match = row.match(/A=(\d) B=(\d) → (\d)/)
                                                    if (!match) return null
                                                    return (
                                                        <tr key={rIdx} className="group hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-4 text-center opacity-70 group-hover:opacity-100">{match[1]}</td>
                                                            <td className="py-4 text-center opacity-70 group-hover:opacity-100">{match[2]}</td>
                                                            <td className="py-4 text-center text-xl font-bold" style={{ color: match[3] === '1' ? colors.primary : '#ffffff20' }}>
                                                                {match[3]}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : puzzle.type === 'binary' ? (
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {puzzle.displayData.split(' ').map((byte, bIdx) => (
                                            <motion.div
                                                key={bIdx}
                                                whileHover={{ scale: 1.1, y: -5 }}
                                                className="px-6 py-5 rounded-2xl border-2 font-mono text-2xl font-black bg-black/40 shadow-inner"
                                                style={{ borderColor: `${colors.primary}66`, color: colors.primary }}
                                            >
                                                {byte}
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : puzzle.type === 'anagram' ? (
                                    <div className="flex justify-center gap-3 flex-wrap">
                                        {puzzle.displayData.split(' ').filter(c => c).map((char, cIdx) => (
                                            <motion.div
                                                key={cIdx}
                                                drag
                                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                                className="w-14 h-18 rounded-2xl border-2 flex items-center justify-center text-3xl font-black font-mono cursor-grab active:cursor-grabbing bg-black/60"
                                                style={{ borderColor: `${colors.primary}88`, color: colors.primary, boxShadow: `0 10px 20px -10px ${colors.glow}` }}
                                            >
                                                {char}
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <motion.div 
                                        animate={{ scale: [1, 1.02, 1] }}
                                        transition={{ repeat: Infinity, duration: 4 }}
                                        className="text-center font-mono text-5xl md:text-7xl font-black tracking-tighter" 
                                        style={{ color: colors.primary, textShadow: `0 0 40px ${colors.glow}` }}
                                    >
                                        {puzzle.displayData}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        {/* Control Interface */}
                        <div className="mt-auto space-y-4">
                            {puzzle.choices ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {puzzle.choices.map((choice, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setAnswer(choice)}
                                            className={`h-16 rounded-[1.25rem] border-2 font-mono font-black text-sm uppercase tracking-widest transition-all ${
                                                answer === choice ? 'text-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                                            }`}
                                            style={answer === choice ? { background: colors.primary, borderColor: colors.primary, boxShadow: `0 0 30px ${colors.glow}` } : {}}
                                        >
                                            {choice}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={answer}
                                        onChange={(e) => { setAnswer(e.target.value); setStatusMessage(null); }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        placeholder="Uplink decrypted sequence..."
                                        className="w-full h-20 px-8 rounded-full border-2 bg-black/60 font-mono text-xl placeholder:text-white/10 outline-none transition-all focus:ring-4"
                                        style={{ borderColor: `${colors.primary}22`, color: colors.primary }}
                                        autoFocus
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-mono opacity-20 pointer-events-none">UPLINK_SEQ_↵</div>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!answer.trim() || submitting}
                                className={`w-full h-20 rounded-full font-mono text-lg uppercase tracking-[0.5em] font-black transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn ${
                                    answer.trim() ? 'text-black scale-[1.01]' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'
                                }`}
                                style={answer.trim() ? { background: colors.primary, boxShadow: `0 20px 40px -10px ${colors.glow}` } : {}}
                            >
                                {submitting ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                                        <span>INIT_SEQUENCE</span>
                                    </>
                                )}
                                {answer.trim() && !submitting && (
                                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
                
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }

                .glitch-hover:hover {
                    animation: glitch 0.3s linear infinite;
                }

                body {
                    background-color: #010101;
                    font-family: 'Space Grotesk', sans-serif;
                }
                
                h1, h2, button, input {
                    font-family: 'Space Mono', monospace;
                }

                ::selection {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    )
}

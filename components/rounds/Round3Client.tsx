'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Zap, BookOpen, Cpu, Battery, Lightbulb, Activity } from 'lucide-react'
import { toast } from 'sonner'

interface DiagramOption { id: string; label: string; description: string; image_url?: string }
interface Problem { id: string; title: string; problem: string; diagram_options: DiagramOption[] }

// SVG Circuit Generator (Abstract Representations)
const getCircuitSvg = (index: number, isSelected: boolean) => {
    const color = isSelected ? '#3b82f6' : '#64748b'; // blue-500 : slate-500
    const glow = isSelected ? `drop-shadow(0 0 8px ${color})` : 'none';
    
    switch (index % 4) {
        case 0: // Power/Battery abstract
            return (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: glow, transition: 'all 0.3s' }}>
                    <rect x="2" y="7" width="16" height="10" rx="2" />
                    <line x1="22" y1="11" x2="22" y2="13" />
                    <line x1="6" y1="12" x2="6" y2="12" strokeWidth="3" />
                    <line x1="10" y1="12" x2="10" y2="12" strokeWidth="3" />
                    <line x1="14" y1="12" x2="14" y2="12" strokeWidth="3" />
                    <path d="M2 17L2 20L10 20" opacity="0.4" />
                </svg>
            );
        case 1: // Sensor/Light abstract
            return (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: glow, transition: 'all 0.3s' }}>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    <path d="M12 17L12 22M7 22L17 22" opacity="0.4" />
                </svg>
            );
        case 2: // Motor/Logic abstract
            return (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: glow, transition: 'all 0.3s' }}>
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <line x1="9" y1="1" x2="9" y2="4" opacity="0.4" />
                    <line x1="15" y1="1" x2="15" y2="4" opacity="0.4" />
                    <line x1="9" y1="20" x2="9" y2="23" opacity="0.4" />
                    <line x1="15" y1="20" x2="15" y2="23" opacity="0.4" />
                    <line x1="20" y1="9" x2="23" y2="9" opacity="0.4" />
                    <line x1="20" y1="14" x2="23" y2="14" opacity="0.4" />
                    <line x1="1" y1="9" x2="4" y2="9" opacity="0.4" />
                    <line x1="1" y1="14" x2="4" y2="14" opacity="0.4" />
                </svg>
            );
        case 3: // Relay/Switch abstract
            return (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: glow, transition: 'all 0.3s' }}>
                    <path d="M5 12H9" />
                    <path d="M19 12H15" />
                    <path d="M9 12L13 8" />
                    <circle cx="5" cy="12" r="2" opacity="0.4" />
                    <circle cx="19" cy="12" r="2" opacity="0.4" />
                    <path d="M12 2L12 6M12 18L12 22" opacity="0.4" strokeDasharray="2 2" />
                </svg>
            );
        default:
            return <Activity size={48} color={color} style={{ filter: glow, transition: 'all 0.3s' }} />;
    }
};

export default function Round3Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [explanation, setExplanation] = useState<string | null>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        fetch('/api/round3/problem', { cache: 'no-store' })
            .then(r => r.json())
            .then(data => setProblem(data))
            .catch(() => toast.error('Failed to load problem'))
            .finally(() => setLoading(false))
    }, [])

    const handleSubmit = async () => {
        if (!problem || !selected || submitting) return
        setSubmitting(true)
        setFailed(false)
        try {
            const res = await fetch('/api/round3/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem_id: problem.id, selected_option: selected }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error); return }
            if (data.passed) {
                setExplanation(data.explanation)
                toast.success('Correct! Schematic locked.')
                setTimeout(() => router.push('/dashboard'), 4000)
            } else {
                setFailed(true)
                toast.error('Circuit shorted. Try a different schematic.')
                setSelected(null)
            }
        } catch { toast.error('Submission error') }
        finally { setSubmitting(false) }
    }

    if (loading) return <div className="flex flex-col items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary mb-4" /><span className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">Loading Blueprint...</span></div>

    return (
        <div className="max-w-4xl mx-auto space-y-8 relative">
            {/* Blueprint grid background decoration */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03]" style={{ 
                backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
            }} />

            <div className="glass-card rounded-xl p-6 border border-primary/20 bg-[#0f172a]/80 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Cpu size={120} />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-3 font-mono tracking-tight">
                    <Zap size={22} className="text-blue-400" /> {problem?.title}
                </h2>
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Engineering Brief</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed font-sans">{problem?.problem}</p>
                </div>
            </div>

            {/* Explanation Modal after correct */}
            <AnimatePresence>
                {explanation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="glass-card rounded-xl p-6 border border-green-500/50 bg-green-500/5 relative overflow-hidden"
                    >
                        {/* Schematic success lines */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-green-500 via-transparent to-transparent" />
                        
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 size={18} className="text-green-400" />
                            </div>
                            <h3 className="font-mono font-bold text-green-400 uppercase tracking-wide">Circuit Validated</h3>
                        </div>
                        <div className="flex items-start gap-4">
                            <BookOpen size={20} className="text-green-400/50 flex-shrink-0" />
                            <p className="text-sm text-foreground/90 leading-relaxed font-sans">{explanation}</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <span className="text-[10px] font-mono text-green-400/50 uppercase tracking-widest animate-pulse">Routing to dashboard...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Circuit Options Grid */}
            {!explanation && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Select Schematic Structure</span>
                        <span className="text-[10px] font-mono text-primary/50 uppercase">v2.0.4a</span>
                    </div>
                
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {problem?.diagram_options.map((opt, i) => (
                            <motion.button
                                key={opt.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.01, y: -2 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => !submitting && setSelected(opt.id)}
                                className={`group p-0 rounded-xl border text-left transition-all duration-300 cursor-pointer overflow-hidden relative
                                    ${selected === opt.id ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-primary/50' : 'border-border bg-muted/20 hover:border-primary/40'}
                                    ${failed && selected === opt.id ? 'border-red-500/50 bg-red-500/5 animate-shake' : ''}
                                `}
                            >
                                {/* Schematic Grid Header */}
                                <div className={`px-4 py-2 border-b flex justify-between items-center bg-[#0a0a0a]
                                    ${selected === opt.id ? 'border-primary/30' : 'border-border/50 group-hover:border-primary/20'}
                                `}>
                                    <span className={`text-[10px] font-mono font-bold tracking-widest
                                        ${selected === opt.id ? 'text-primary' : 'text-muted-foreground'}
                                    `}>SCHEMATIC_{opt.id}</span>
                                    {selected === opt.id && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                </div>

                                {/* Diagram Area */}
                                <div className="p-5">
                                    <div className={`w-full h-32 rounded-lg border mb-4 flex items-center justify-center relative overflow-hidden transition-colors duration-300
                                        ${selected === opt.id ? 'bg-[#0f172a] border-primary/40' : 'bg-[#0a0a0a] border-border/50 group-hover:border-primary/20'}
                                    `}>
                                        {/* Mini blueprint lines inside diagram area */}
                                        <div className="absolute inset-0 opacity-[0.1]" style={{ 
                                            backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', 
                                            backgroundSize: '10px 10px' 
                                        }} />
                                        
                                        {getCircuitSvg(i, selected === opt.id)}
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <p className={`text-sm font-bold font-sans ${selected === opt.id ? 'text-foreground' : 'text-foreground/80'}`}>{opt.label}</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{opt.description}</p>
                                    </div>
                                </div>
                                
                                {/* Active Selection Overlay */}
                                {selected === opt.id && !failed && (
                                    <div className="absolute inset-0 pointer-events-none border-2 border-primary rounded-xl" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 10%, 0 0)' }} />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!selected || submitting}
                        className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-mono text-sm tracking-widest font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.3)] relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        {submitting ? (
                            <><Loader2 size={18} className="animate-spin relative z-10" /> <span className="relative z-10">VALIDATING CIRCUIT...</span></>
                        ) : (
                            <><Activity size={18} className="relative z-10" /> <span className="relative z-10">FINALIZE SCHEMATIC</span></>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

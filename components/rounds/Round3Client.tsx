'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Zap, BookOpen, Cpu, Battery, Lightbulb, Activity, Gauge } from 'lucide-react'
import { toast } from 'sonner'
import GridConnect from './Round3GridConnect'

interface Problem { id: string; title: string; problem: string; }

export default function Round3Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<Problem | null>(null)
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
        if (!problem || submitting) return
        setSubmitting(true)
        setFailed(false)
        try {
            const res = await fetch('/api/round3/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problem_id: problem.id, success: true }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error); return }
            if (data.passed) {
                setExplanation(data.explanation)
                toast.success('Connection Stable: Handshake Complete.')
                setTimeout(() => router.push('/dashboard'), 4000)
            } else {
                setFailed(true)
                toast.error('Phase Mismatch: Network Rejected.')
            }
        } catch { toast.error('Transmission Error') }
        finally { setSubmitting(false) }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-amber-500 mb-4" />
            <span className="text-[10px] font-mono text-amber-500/50 uppercase tracking-[0.3em] animate-pulse italic">
                Synchronizing Phase Vectors...
            </span>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-8 relative">
            {/* Blueprint grid background decoration */}
            <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.05]" style={{ 
                backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)', 
                backgroundSize: '40px 40px' 
            }} />

            <div className="glass-card rounded-xl p-6 border border-amber-500/20 bg-[#0A0A0A]/80 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                    <Zap size={240} className="text-amber-500" />
                </div>
                
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                            <Activity size={20} className="text-amber-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-amber-500 font-mono tracking-tighter uppercase italic drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                                {problem?.title.toUpperCase() || 'GRID_ARCHITECT_v3.0'}
                            </h2>
                            <div className="text-[9px] font-mono text-amber-500/50 uppercase tracking-widest">Protocol: PES_HANDSHAKE_v42</div>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-950/20 p-5 rounded-lg border border-amber-500/10 relative">
                    <div className="absolute top-0 right-0 p-2">
                        <Cpu size={14} className="text-amber-500/20" />
                    </div>
                    <h3 className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> SYSTEM_BRIEF
                    </h3>
                    <p className="text-amber-100/80 text-sm leading-relaxed font-sans italic">
                        "{problem?.problem}"
                    </p>
                </div>
            </div>

            {/* Explanation Modal after correct */}
            <AnimatePresence>
                {explanation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="glass-card rounded-xl p-8 border border-green-500/50 bg-green-950/20 relative overflow-hidden"
                    >
                        {/* Schematic success lines */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                <CheckCircle2 size={24} className="text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-mono font-black text-green-400 uppercase tracking-widest text-lg italic">Phase Lock Achieved</h3>
                                <p className="text-[10px] font-mono text-green-500/60 uppercase tracking-wider">Topology Integrity: 100%</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4 p-5 bg-white/5 rounded-lg border border-white/5">
                            <BookOpen size={20} className="text-green-400/50 mt-1 flex-shrink-0" />
                            <p className="text-sm text-green-50/90 leading-relaxed font-sans tracking-wide">
                                {explanation}
                            </p>
                        </div>
                        
                        <div className="mt-8 flex items-center justify-between">
                            <div className="flex gap-1">
                                {[1,2,3].map(i => <div key={i} className="w-4 h-1 bg-green-500/30 rounded-full" />)}
                            </div>
                            <span className="text-[10px] font-mono text-green-400/50 uppercase tracking-[0.3em] animate-pulse">Routing to Command Dashboard...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interactive Grid Connect */}
            {!explanation && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span className="text-[10px] font-mono text-amber-500/70 uppercase tracking-widest font-black">ACTIVE_ROUTING_SESSION</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">[GRID_5x5]</span>
                            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest cursor-not-allowed">[MAPPING_OFF]</span>
                        </div>
                    </div>
                
                    <GridConnect onSuccess={handleSubmit} />

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl backdrop-blur-sm">
                        <p className="text-[10px] font-mono text-amber-500/60 text-center uppercase tracking-[0.2em] font-medium">
                            Synthesize a continuous path from the <span className="text-blue-400 font-bold underline decoration-blue-500/30">Substation</span> 
                            to the <span className="text-green-500 font-bold underline decoration-green-500/30">Node_Farm</span>.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

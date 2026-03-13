'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Zap, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface DiagramOption { id: string; label: string; description: string; image_url?: string }
interface Problem { id: string; title: string; problem: string; diagram_options: DiagramOption[] }

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
                toast.success('Correct! Round 3 complete!')
                setTimeout(() => router.push('/dashboard'), 4000)
            } else {
                setFailed(true)
                toast.error('Incorrect. Try a different circuit.')
                setSelected(null)
            }
        } catch { toast.error('Submission error') }
        finally { setSubmitting(false) }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary" /></div>

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                    <Zap size={18} className="text-yellow-400" /> {problem?.title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{problem?.problem}</p>
            </div>

            {/* Explanation Modal after correct */}
            <AnimatePresence>
                {explanation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-2xl p-6 border border-green-500/30"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 size={20} className="text-green-400" />
                            <h3 className="font-semibold text-green-400">Correct! Excellent engineering reasoning.</h3>
                        </div>
                        <div className="flex items-start gap-2 mt-3">
                            <BookOpen size={16} className="text-primary mt-1 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 text-center">Returning to dashboard...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Circuit Options Grid */}
            {!explanation && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {problem?.diagram_options.map((opt, i) => (
                            <motion.button
                                key={opt.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => !submitting && setSelected(opt.id)}
                                className={`p-5 rounded-xl border text-left transition-all duration-300 cursor-pointer
                  ${selected === opt.id ? 'border-primary bg-primary/10 shadow-glow-blue' : 'border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40'}
                  ${failed && selected === opt.id ? 'border-red-500/50 bg-red-500/5' : ''}
                `}
                            >
                                {/* Circuit diagram placeholder — actual SVGs would go here */}
                                <div className={`w-full h-28 rounded-lg mb-3 flex items-center justify-center text-4xl
                  ${selected === opt.id ? 'bg-primary/10' : 'bg-muted/50'}
                `}>
                                    {['⚡', '🔋', '☀️', '🔌'][i % 4]}
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5
                    ${selected === opt.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>{opt.id}</span>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!selected || submitting}
                        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-glow-blue"
                    >
                        {submitting ? <><Loader2 size={18} className="animate-spin" /> Checking...</> : 'Submit Circuit Choice'}
                    </button>
                </>
            )}
        </div>
    )
}

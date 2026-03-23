'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Flame, CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
    id: string
    question: string
    options: { A: string; B: string; C: string; D: string }
    category: string
    difficulty: string
    current_streak: number
}

type OptionKey = 'A' | 'B' | 'C' | 'D'

export default function Round1Client() {
    const router = useRouter()
    const [question, setQuestion] = useState<Question | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [streak, setStreak] = useState(0)
    const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null)
    const [selectedAnswer, setSelectedAnswer] = useState<OptionKey | null>(null)

    const fetchQuestion = useCallback(async () => {
        setLoading(true)
        setLastResult(null)
        setSelectedAnswer(null)
        try {
            const res = await fetch('/api/round1/question', { cache: 'no-store' })
            if (!res.ok) { toast.error('Failed to load question'); return }
            const data = await res.json()
            setQuestion(data)
            setStreak(data.current_streak)
        } catch {
            toast.error('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchQuestion() }, [fetchQuestion])

    const submitAnswer = async (answer: OptionKey) => {
        if (submitting || !question) return
        setSelectedAnswer(answer)
        setSubmitting(true)
        try {
            const res = await fetch('/api/round1/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question_id: question.id, answer }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error); setSubmitting(false); return }

            const isCorrect = data.correct
            setStreak(data.streak)
            setLastResult(isCorrect ? 'correct' : 'wrong')

            if (data.completed) {
                toast.success('🎉 Round 1 Complete! Streak of 5 achieved!')
                setTimeout(() => router.push('/dashboard'), 2000)
                return
            }

            // Wait 1.2s then load next question
            setTimeout(() => { setSubmitting(false); fetchQuestion() }, 1200)
        } catch {
            toast.error('Submission failed')
            setSubmitting(false)
        }
    }

    const optionKeys: OptionKey[] = ['A', 'B', 'C', 'D']

    // Dynamic styling based on tension (streak)
    const getTensionColor = () => {
        if (streak === 0 || streak === 1) return 'var(--primary)' // Calm blue/default
        if (streak === 2 || streak === 3) return '#fbbf24' // Amber
        if (streak === 4) return '#ef4444' // Intense Red
        return '#22c55e' // Green success
    }

    const getTensionGlow = () => {
        if (streak === 0 || streak === 1) return '0 0 10px rgba(var(--primary-rgb), 0.2)'
        if (streak === 2 || streak === 3) return '0 0 15px rgba(251, 191, 36, 0.4)'
        if (streak === 4) return '0 0 25px rgba(239, 68, 68, 0.6)'
        return '0 0 20px rgba(34, 197, 94, 0.5)'
    }

    const tensionPulse = streak === 4 ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 0.8 } } : {}

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header info */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
            >
                <h2 className="text-3xl font-black text-white font-mono tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    Neon Surge Quiz
                </h2>
                <div className="h-0.5 w-24 bg-blue-500 mx-auto rounded-full shadow-[0_0_10px_#3b82f6]" />
                <p className="text-blue-400/70 text-[10px] font-mono uppercase tracking-[0.2em]">Sequence Verification Protocol 1.0.4</p>
            </motion.div>

            {/* Tension Meter / Power Nodes */}
            <motion.div 
                className="glass-card rounded-2xl p-6 flex flex-col items-center gap-5 border border-blue-500/20 bg-blue-500/5 backdrop-blur-md relative overflow-hidden"
                style={{ boxShadow: streak >= 2 ? getTensionGlow() : '0 8px 32px rgba(0,0,0,0.3)' }}
                animate={tensionPulse}
            >
                {/* Background scanning line effect */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_0%,rgba(59,130,246,0.5)_50%,transparent_100%)] bg-[length:100%_4px] animate-scanline" />

                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80" style={{ color: streak >= 3 ? getTensionColor() : undefined }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                    {streak === 5 ? 'COMPILATION SUCCESS' : streak === 4 ? 'SYSTEM OVERLOAD' : 'NEURAL LINK STABILITY'}
                </div>
                
                <div className="flex gap-2 sm:gap-4 w-full justify-center">
                    {[1, 2, 3, 4, 5].map(i => {
                        const isActive = streak >= i;
                        const isCurrentTarget = streak + 1 === i;
                        
                        return (
                            <motion.div
                                key={i}
                                initial={false}
                                animate={{ 
                                    scale: isActive ? 1.05 : 1,
                                    backgroundColor: isActive ? getTensionColor() : 'rgba(255,255,255,0.05)',
                                    borderColor: isActive ? getTensionColor() : isCurrentTarget ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`h-2 sm:h-3 flex-1 max-w-[60px] rounded-full border border-transparent overflow-hidden relative ${isActive ? 'shadow-lg' : ''}`}
                            >
                                {/* Active core glow */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/20 blur-[2px]" />
                                )}
                                {/* Pulsing target */}
                                {isCurrentTarget && (
                                    <motion.div 
                                        className="h-full w-full bg-white/10"
                                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    />
                                )}
                            </motion.div>
                        )
                    })}
                </div>
                <div className="flex justify-between w-full max-w-[340px] px-2 text-[10px] font-mono text-muted-foreground uppercase">
                    <span>Init</span>
                    <span style={{ color: streak >= 4 ? '#ef4444' : undefined }}>{streak}/5 Loaded</span>
                    <span>Exec</span>
                </div>
            </motion.div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-card rounded-2xl p-8 flex items-center justify-center h-80 border border-border/50"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">Fetching Logic Payload...</span>
                        </div>
                    </motion.div>
                ) : question ? (
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                        transition={{ duration: 0.4 }}
                        className={`glass-card rounded-2xl p-6 md:p-8 space-y-6 transition-all duration-500 relative overflow-hidden border
                            ${lastResult === 'correct' ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)] bg-green-500/5' : 'border-blue-500/30 bg-black/40'}
                            ${lastResult === 'wrong' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] bg-red-500/5' : ''}
                        `}
                    >
                        {/* Terminal header decoration */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
                        
                        {/* Category badge */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-sm font-mono uppercase tracking-wider">
                                    SYS.{question.category.replace('_', '.')}
                                </span>
                                <span className={`text-[10px] px-3 py-1 rounded-sm border font-mono uppercase tracking-wider
                                    ${question.difficulty === 'easy' ? 'bg-green-500/5 text-green-400 border-green-500/20' :
                                      question.difficulty === 'medium' ? 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20' :
                                      'bg-red-500/5 text-red-400 border-red-500/20'
                                    }`}>
                                    LVL.{question.difficulty}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground/50 hidden sm:block">ID:{question.id.substring(0,8)}</span>
                        </div>

                        {/* Question */}
                        <div className="py-2">
                            <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed font-sans">{question.question}</p>
                        </div>

                        {/* Result feedback */}
                        {lastResult && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-mono ${lastResult === 'correct'
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}
                            >
                                {lastResult === 'correct'
                                    ? <><CheckCircle2 size={18} /> <span>[SUCCESS] Sequence validated. Compiling next payload...</span></>
                                    : <><XCircle size={18} /> <span>[FATAL] Logic error detected. Matrix reset initiated...</span></>
                                }
                            </motion.div>
                        )}

                        {/* Options */}
                        <div className="grid grid-cols-1 gap-3">
                            {optionKeys.map(key => {
                                const isSelected = selectedAnswer === key;
                                const isCorrectState = isSelected && lastResult === 'correct';
                                const isWrongState = isSelected && lastResult === 'wrong';
                                
                                return (
                                    <motion.button
                                        key={key}
                                        whileHover={{ scale: submitting ? 1 : 1.01, x: submitting ? 0 : 4 }}
                                        whileTap={{ scale: 0.99 }}
                                        disabled={submitting}
                                        onClick={() => submitAnswer(key)}
                                        className={`group flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-300 relative overflow-hidden
                                            ${isCorrectState ? 'border-green-500 bg-green-500/10 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}
                                            ${isWrongState ? 'border-red-500 bg-red-500/10 text-red-300' : ''}
                                            ${!isSelected ? 'border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 cursor-pointer' : ''}
                                            ${submitting && !isSelected ? 'opacity-40 cursor-not-allowed scale-95' : ''}
                                        `}
                                    >
                                        {/* Hover line indicator */}
                                        {!submitting && !isSelected && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/0 group-hover:bg-primary/50 transition-colors" />
                                        )}
                                        
                                        <span className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-xs font-mono font-bold transition-colors
                                            ${isCorrectState ? 'bg-green-500 text-black' : ''}
                                            ${isWrongState ? 'bg-red-500 text-white' : ''}
                                            ${!isSelected ? 'bg-muted border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/30' : ''}
                                        `}>
                                            {key}
                                        </span>
                                        <span className="text-[15px] font-medium text-foreground/90 font-sans tracking-wide">{question.options[key]}</span>
                                        
                                        {submitting && isSelected && !lastResult && (
                                            <Loader2 size={16} className="ml-auto animate-spin text-primary" />
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

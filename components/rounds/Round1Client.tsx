'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Flame, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
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

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header info */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Console Log Quiz</h2>
                <p className="text-muted-foreground text-sm">Answer 5 questions correctly in a row to proceed</p>
            </div>

            {/* Streak Meter */}
            <div className="glass-card rounded-2xl p-5 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Flame size={16} className="text-orange-400" /> Streak
                </div>
                <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <motion.div
                            key={i}
                            animate={{ scale: streak >= i ? [1, 1.3, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                ${streak >= i ? 'streak-dot-active' : 'streak-dot-inactive'}
              `}
                        >
                            {streak >= i ? '🔥' : '○'}
                        </motion.div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">{streak}/5 correct in a row</p>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glass-card rounded-2xl p-8 flex items-center justify-center h-72"
                    >
                        <Loader2 size={32} className="animate-spin text-primary" />
                    </motion.div>
                ) : question ? (
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`glass-card rounded-2xl p-6 md:p-8 space-y-6 transition-all duration-300
              ${lastResult === 'correct' ? 'answer-correct' : ''}
              ${lastResult === 'wrong' ? 'answer-wrong animate-shake' : ''}
            `}
                    >
                        {/* Category badge */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 rounded-full font-medium capitalize">
                                {question.category.replace('_', ' ')}
                            </span>
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${question.difficulty === 'easy' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                    question.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                        'bg-red-500/10 text-red-400 border-red-500/30'
                                }`}>
                                {question.difficulty}
                            </span>
                        </div>

                        {/* Question */}
                        <p className="text-lg font-medium text-foreground leading-relaxed">{question.question}</p>

                        {/* Result feedback */}
                        {lastResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`flex items-center gap-2 p-3 rounded-xl ${lastResult === 'correct'
                                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                    }`}
                            >
                                {lastResult === 'correct'
                                    ? <><CheckCircle2 size={18} /> Correct! Loading next question...</>
                                    : <><XCircle size={18} /> Wrong! Streak reset. New question loading...</>
                                }
                            </motion.div>
                        )}

                        {/* Options */}
                        <div className="grid grid-cols-1 gap-3">
                            {optionKeys.map(key => (
                                <motion.button
                                    key={key}
                                    whileHover={{ scale: submitting ? 1 : 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    disabled={submitting}
                                    onClick={() => submitAnswer(key)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200
                    ${selectedAnswer === key && lastResult === 'correct' ? 'border-green-500 bg-green-500/10 text-green-400' : ''}
                    ${selectedAnswer === key && lastResult === 'wrong' ? 'border-red-500 bg-red-500/10 text-red-400' : ''}
                    ${!selectedAnswer || selectedAnswer !== key ? 'border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 cursor-pointer' : ''}
                    ${submitting && selectedAnswer !== key ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                                >
                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                    ${selectedAnswer === key && lastResult === 'correct' ? 'bg-green-500 text-white' : ''}
                    ${selectedAnswer === key && lastResult === 'wrong' ? 'bg-red-500 text-white' : ''}
                    ${!selectedAnswer || selectedAnswer !== key ? 'bg-primary/10 text-primary' : ''}
                  `}>
                                        {key}
                                    </span>
                                    <span className="text-sm text-foreground/90">{question.options[key]}</span>
                                    {submitting && selectedAnswer === key && !lastResult && (
                                        <Loader2 size={16} className="ml-auto animate-spin text-muted-foreground" />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

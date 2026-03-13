'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Play, Pause, Send, Trophy, Loader2, Radio, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { formatTime } from '@/lib/timer'

interface AudioClip { id: string; audio_url: string; morse_code: string; number: number }

export default function Round5Client() {
    const router = useRouter()
    const [clips, setClips] = useState<AudioClip[]>([])
    const [loading, setLoading] = useState(true)
    const [playing, setPlaying] = useState<string | null>(null)
    const [finalKey, setFinalKey] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [completed, setCompleted] = useState<{ total_time: number; final_rank: number | null } | null>(null)
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

    useEffect(() => {
        fetch('/api/round5/audio', { cache: 'no-store' })
            .then(r => r.json())
            .then(data => setClips(data.clips ?? []))
            .catch(() => toast.error('Failed to load audio clips'))
            .finally(() => setLoading(false))
    }, [])

    const togglePlay = (clip: AudioClip) => {
        // Stop all others
        Object.entries(audioRefs.current).forEach(([id, el]) => {
            if (id !== clip.id) { el.pause(); el.currentTime = 0 }
        })

        if (!audioRefs.current[clip.id]) {
            audioRefs.current[clip.id] = new Audio(clip.audio_url)
            audioRefs.current[clip.id].onended = () => setPlaying(null)
        }

        const audio = audioRefs.current[clip.id]
        if (playing === clip.id) {
            audio.pause()
            setPlaying(null)
        } else {
            audio.play().catch(() => toast.error('Could not play audio'))
            setPlaying(clip.id)
        }
    }

    const handleSubmit = async () => {
        if (!finalKey.trim() || submitting) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/round5/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: finalKey }),
            })
            const data = await res.json()
            if (!res.ok) { toast.error(data.error); return }

            if (data.passed) {
                // 🎉 Confetti!
                confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335'] })
                setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.5 } }), 500)
                setCompleted({ total_time: data.total_time, final_rank: data.final_rank })
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch { toast.error('Submission failed') }
        finally { setSubmitting(false) }
    }

    // Completion Screen
    if (completed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg mx-auto text-center space-y-8 py-12"
            >
                <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.6 }}
                    className="text-8xl"
                >🏆</motion.div>

                <div className="space-y-2">
                    <h2 className="text-3xl font-bold gradient-text-gold">Mission Complete!</h2>
                    <p className="text-muted-foreground">You've conquered all 5 rounds of TechChallenge 2026</p>
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Time</p>
                            <p className="text-2xl font-mono font-bold text-foreground">{formatTime(completed.total_time)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Rank</p>
                            <p className={`text-2xl font-bold ${completed.final_rank === 1 ? 'gradient-text-gold' : 'text-foreground'}`}>
                                #{completed.final_rank ?? '—'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => router.push('/leaderboard')}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        <Trophy size={18} /> View Leaderboard
                    </button>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 glass border border-border rounded-xl font-medium hover:border-primary/50 transition-all"
                    >
                        Dashboard
                    </button>
                </div>
            </motion.div>
        )
    }

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary" /></div>

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="glass-card rounded-2xl p-5">
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <Radio size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    Decode all 12 Morse code audio clips. Each represents a word. Only one word is the correct final key. Submit it below.
                </p>
            </div>

            {/* Audio Clips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clips.map(clip => (
                    <motion.div
                        key={clip.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 transition-all border
              ${playing === clip.id ? 'border-primary bg-primary/5' : 'border-border'}
            `}
                        onClick={() => togglePlay(clip)}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
              ${playing === clip.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}
            `}>
                            {playing === clip.id ? <Pause size={18} /> : <Play size={18} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">Clip #{clip.number}</p>
                            <p className="text-xs font-mono text-muted-foreground truncate">{clip.morse_code}</p>
                        </div>

                        {/* Waveform animation when playing */}
                        {playing === clip.id && (
                            <div className="flex items-end gap-0.5 h-6">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ scaleY: [0.4, 1.2, 0.4] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-1 bg-primary rounded-full h-full origin-bottom"
                                    />
                                ))}
                            </div>
                        )}

                        {playing !== clip.id && <Volume2 size={16} className="text-muted-foreground flex-shrink-0" />}
                    </motion.div>
                ))}
            </div>

            {/* Final Key Submission */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Send size={14} className="text-primary" /> Submit Final Key
                </h3>
                <p className="text-xs text-muted-foreground">Enter the single word that is the correct final key (case-insensitive)</p>
                <div className="flex gap-3">
                    <input
                        value={finalKey}
                        onChange={e => setFinalKey(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        placeholder="Type the final key word..."
                        className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!finalKey.trim() || submitting}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-glow-blue"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

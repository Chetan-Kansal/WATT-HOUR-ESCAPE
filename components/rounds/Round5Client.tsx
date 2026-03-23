'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Play, Pause, AlertTriangle, KeyRound, CheckCircle2, Trophy, Loader2, Disc, Radio, Terminal, Cpu } from 'lucide-react'
import { toast } from 'sonner'
import MatrixRain from '@/components/effects/MatrixRain'

interface AudioFile { id: string; url: string; sequence: number; morse_code?: string }
interface Problem { clips: AudioFile[]; instructions: string; hint: string }
interface SubmitResult { passed: boolean; total_time: number; final_rank: number | null; message: string }

export default function Round5Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<SubmitResult | null>(null)
    const [playing, setPlaying] = useState<string | null>(null)
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})
    const [terminalText, setTerminalText] = useState<string[]>([])

    // Fake terminal boot sequence
    useEffect(() => {
        if (!loading) {
            const sequence = [
                "ESTABLISHING SECURE CONNECTION...",
                "HANDSHAKE PROTOCOL: ACCEPTED",
                "INTERCEPTING ENCRYPTED TRANSMISSIONS...",
                "WARNING: SIGNAL DEGRADATION DETECTED",
                "AWAITING MANUAL DECRYPTION KEY INPUT."
            ]
            let i = 0;
            const interval = setInterval(() => {
                if (i < sequence.length) {
                    setTerminalText(prev => [...prev, sequence[i]])
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 400);
            return () => clearInterval(interval);
        }
    }, [loading]);

    useEffect(() => {
        fetch('/api/round5/audio', { cache: 'no-store' })
            .then(r => r.json())
            .then(data => {
                if (data.clips) {
                    setProblem({
                        clips: data.clips.map((c: any) => ({
                            id: c.id,
                            url: c.audio_url,
                            sequence: c.number,
                            morse_code: c.morse_code
                        })),
                        instructions: data.instructions,
                        hint: data.hint
                    })
                }
            })
            .catch(() => toast.error('Failed to load transmission'))
            .finally(() => setLoading(false))

        return () => {
            Object.values(audioRefs.current).forEach(a => { a.pause(); a.src = '' })
        }
    }, [])

    const togglePlay = (id: string, url: string) => {
        if (playing && playing !== id && audioRefs.current[playing]) {
            audioRefs.current[playing].pause()
            audioRefs.current[playing].currentTime = 0
        }
        if (!audioRefs.current[id]) {
            const a = new Audio(url)
            a.onended = () => setPlaying(null)
            audioRefs.current[id] = a
        }
        const audio = audioRefs.current[id]
        if (playing === id) { audio.pause(); setPlaying(null) }
        else { audio.play().then(() => setPlaying(id)).catch(() => toast.error('Playback failed')) }
    }

    const fireConfetti = () => {
        const duration = 3 * 1000
        const end = Date.now() + duration
        const frame = () => {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff0000', '#00ff00', '#0000ff'] })
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff0000', '#00ff00', '#0000ff'] })
            if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!problem || !answer.trim() || submitting || result) return
        
        setSubmitting(true)
        
        // Simulating decryption delay for effect
        setTerminalText(prev => [...prev, "> DECRYPT(KEY: '" + answer.toUpperCase() + "')"])
        setTerminalText(prev => [...prev, "EXECUTING DECRYPTION ALGORITHM..."])
        
        setTimeout(async () => {
            try {
                const res = await fetch('/api/round5/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: answer.trim().toUpperCase() }),
                })
                const data = await res.json()
                if (!res.ok) { 
                    setTerminalText(prev => [...prev, "ERROR: INVALID KEY. DECRYPTION FAILED."])
                    toast.error(data.error || 'Decryption failed')
                    setSubmitting(false)
                    return 
                }
                
                setResult(data)
                if (data.passed) {
                    setTerminalText(prev => [...prev, "SUCCESS: PAYLOAD DECRYPTED."])
                    fireConfetti()
                    toast.success('System breached! Competition complete!')
                } else {
                    setTerminalText(prev => [...prev, "ACCESS DENIED: INCORRECT KEY."])
                    toast.error('Incorrect key.')
                }
            } catch { 
                toast.error('Signal lost. Try again.') 
                setTerminalText(prev => [...prev, "FATAL: SIGNAL CONNECTION LOST."])
            }
            finally { setSubmitting(false) }
        }, 1500) // 1.5s fake delay
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 size={32} className="animate-spin text-green-500" />
            <span className="text-xs font-mono text-green-500 tracking-[0.3em] font-black uppercase animate-pulse">Breaching Firewall...</span>
        </div>
    )

    if (result?.passed) return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center space-y-8 relative">
            <MatrixRain color="#22c55e" opacity={0.15} speed={1.2} />
            <div className="glass-card rounded-2xl p-12 border border-green-500/30 bg-[#0a150a] relative overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                {/* Matrix rain effect background overlay */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #22c55e 2px, #22c55e 4px)', backgroundSize: '100% 4px' }} />
                
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/50 relative z-10 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <Trophy size={48} className="text-green-400" />
                </motion.div>
                
                <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight relative z-10 font-mono">MISSION ACCOMPLISHED</h2>
                <p className="text-green-400 text-lg mb-8 font-mono relative z-10 uppercase tracking-widest shadow-green-500/50 drop-shadow-md">System Override Successful</p>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto relative z-10">
                    <div className="bg-black/50 border border-green-500/30 rounded-xl p-4 transform transition-all hover:scale-105">
                        <p className="text-[10px] text-green-500/70 font-mono uppercase tracking-widest mb-1">Rank Achieved</p>
                        <p className="text-3xl font-bold font-mono text-white">#{result.final_rank || '?'}</p>
                    </div>
                    <div className="bg-black/50 border border-green-500/30 rounded-xl p-4 transform transition-all hover:scale-105">
                        <p className="text-[10px] text-green-500/70 font-mono uppercase tracking-widest mb-1">Time (Seconds)</p>
                        <p className="text-3xl font-bold font-mono text-white">{Math.round(result.total_time)}s</p>
                    </div>
                </div>
            </div>
            
            <button onClick={() => router.push('/dashboard')} className="px-8 py-3 bg-green-600/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-600/30 transition-all font-mono uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                Return to Base
            </button>
        </motion.div>
    )

    return (
        <div className="max-w-2xl mx-auto space-y-6 relative">
            <MatrixRain color="#22c55e" opacity={0.15} speed={0.8} />
            
            {/* Terminal Header */}
            <div className="glass-card rounded-t-xl rounded-b-sm border border-green-500/40 bg-[#000a00] p-2 flex items-center justify-between border-b-green-500/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-green-500/5 animate-pulse pointer-events-none" />
                <div className="flex gap-1.5 ml-2 relative z-10">
                    <div className="w-3 h-3 rounded-full bg-green-600 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-green-900/50" />
                    <div className="w-3 h-3 rounded-full bg-green-900/50" />
                </div>
                <div className="flex items-center gap-2 mr-2 opacity-90 relative z-10">
                    <AlertTriangle size={14} className="text-green-500 animate-bounce" />
                    <span className="text-[10px] font-black font-mono text-green-500 tracking-[0.2em]">SYSTEM_BREACH_V1.0</span>
                </div>
            </div>

            {/* Terminal Console Output */}
            <div className="glass-card rounded-sm border border-green-500/20 bg-[#0a0a0a] p-5 h-48 overflow-y-auto font-mono text-[11px] leading-relaxed relative flex flex-col justify-end">
                {/* Subtle scanline overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #22c55e 2px, #22c55e 4px)', backgroundSize: '100% 4px' }} />
                
                <div className="space-y-1 relative z-10 w-full">
                    {terminalText.map((text, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -5 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            className={
                                (text?.includes?.('ERROR') || text?.includes?.('FATAL') || text?.includes?.('DENIED')) 
                                ? 'text-red-500 font-black animate-glitch' 
                                : text?.includes?.('SUCCESS') 
                                ? 'text-green-400 font-bold drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                                : text?.startsWith?.('>') 
                                ? 'text-white font-bold' 
                                : 'text-green-500/70'
                            }
                        >
                            {text}
                        </motion.div>
                    ))}
                    {submitting && (
                        <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="text-green-500/70">
                            _
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="grid gap-4">
                {problem?.clips.map((file, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        key={file.id} 
                        className={`glass-card p-4 rounded-sm border flex items-center justify-between group transition-colors font-mono
                            ${playing === file.id ? 'border-green-500/50 bg-[#0a150a] shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]' : 'border-green-500/10 bg-[#0a0a0a] hover:border-green-500/30'}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-green-500/20 italic tracking-tighter w-8 text-center bg-green-500/5 rounded p-1 border border-green-500/10">0{file.sequence}</span>
                            <div>
                                <h3 className={`font-bold tracking-widest uppercase text-xs ${playing === file.id ? 'text-green-400' : 'text-green-500/70'}`}>
                                    SIG_INT_{file.id.substring(0, 4)}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 opacity-60">
                                    <Radio size={10} className={playing === file.id ? 'text-green-400 animate-pulse' : 'text-green-500/50'} />
                                    <span className="text-[9px] text-green-500/50 uppercase tracking-widest">{playing === file.id ? 'Transmitting Data...' : 'Encrypted Signal Ready'}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Audio Waveform visualization (fake) */}
                        <div className="hidden sm:flex items-center gap-0.5 h-6 mx-4 flex-1 justify-center opacity-30">
                            {[...Array(15)].map((_, i) => (
                                <motion.div 
                                    key={i}
                                    animate={playing === file.id ? { height: ['20%', '100%', '30%', '80%', '10%'] } : { height: '10%' }}
                                    transition={{ duration: 0.5 + Math.random(), repeat: Infinity, repeatType: 'mirror' }}
                                    className="w-1 bg-green-500/50 rounded-full"
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => togglePlay(file.id, file.url)}
                            className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all flex-shrink-0 border 
                                ${playing === file.id 
                                    ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                    : 'bg-[#001100] text-green-500/50 border-green-500/20 hover:bg-[#001a00] hover:text-green-400'}
                            `}
                        >
                            {playing === file.id ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
                        </button>
                    </motion.div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="relative mt-8 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-green-500/70 font-mono text-sm">{'>'}</span>
                </div>
                <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                    placeholder="ENTER DECRYPTION KEY..."
                    className="w-full pl-10 pr-32 py-4 bg-[#0a0a0a] border border-green-500/30 rounded-sm text-green-400 placeholder:text-green-500/30 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all font-mono uppercase tracking-widest text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                    required
                    disabled={submitting}
                />
                
                {answer && !submitting && (
                    <div className="absolute right-32 top-1/2 -translate-y-1/2 w-2 h-4 bg-green-500 animate-pulse pointer-events-none" />
                )}

                <button
                    type="submit"
                    disabled={!answer.trim() || submitting}
                    className="absolute right-2 top-2 bottom-2 px-6 bg-green-600 text-white rounded-sm font-black font-mono text-xs tracking-[0.2em] hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 border border-green-400/30 uppercase shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                    {submitting ? 'BYPASSING...' : 'INITIATE_BREACH'}
                </button>
            </form>
        </div>
    )
}

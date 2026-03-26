'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Play, Pause, AlertTriangle, Trophy, Loader2, Radio, Terminal, Cpu, Zap, Activity, BookOpen, Music } from 'lucide-react'
import { toast } from 'sonner'
import MatrixRain from '@/components/effects/MatrixRain'
import { MORSE_MAP, ROUND5_SIGNALS } from '@/lib/round5/constants'

interface Signal { id: string; label: string }
interface Problem { signals: Signal[]; instructions: string; hint: string }
interface SubmitResult { passed: boolean; total_time: number; message: string }

export default function Round5Client() {
    const router = useRouter()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [answer, setAnswer] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<SubmitResult | null>(null)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [terminalText, setTerminalText] = useState<string[]>([])
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
    const [showGuide, setShowGuide] = useState(false)
    
    const audioCtxRef = useRef<AudioContext | null>(null)
    const oscillatorRef = useRef<OscillatorNode | null>(null)
    const gainNodeRef = useRef<GainNode | null>(null)
    const stopPlaybackRef = useRef<(() => void) | null>(null)

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
                if (data.signals) {
                    setProblem({
                        signals: data.signals,
                        instructions: data.instructions,
                        hint: data.hint
                    })
                }
            })
            .catch(() => toast.error('Failed to load transmission'))
            .finally(() => setLoading(false))

        return () => {
            if (stopPlaybackRef.current) stopPlaybackRef.current()
            if (audioCtxRef.current) audioCtxRef.current.close()
        }
    }, [])

    const playMorse = async (id: string) => {
        if (playingId === id) {
            if (stopPlaybackRef.current) stopPlaybackRef.current()
            return
        }

        if (stopPlaybackRef.current) stopPlaybackRef.current()

        const signal = ROUND5_SIGNALS.find(s => s.id === id)
        if (!signal) return

        const word = signal.word.toUpperCase()
        
        // Initialize Audio context if needed
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        
        const ctx = audioCtxRef.current
        if (ctx.state === 'suspended') await ctx.resume()

        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(600, ctx.currentTime) // 600Hz tone
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime)
        
        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        oscillator.start()

        setPlayingId(id)

        let isStopped = false
        stopPlaybackRef.current = () => {
            isStopped = true
            setPlayingId(null)
            try {
                oscillator.stop()
                oscillator.disconnect()
                gainNode.disconnect()
            } catch (e) {}
        }

        const unit = 0.12 / playbackSpeed // Adjust unit based on speed
        let time = ctx.currentTime + 0.1

        for (let i = 0; i < word.length; i++) {
            if (isStopped) break
            const char = word[i]
            const code = MORSE_MAP[char] || ''
            
            for (let j = 0; j < code.length; j++) {
                if (isStopped) break
                const symbol = code[j]
                const duration = symbol === '.' ? unit : unit * 3
                
                // Beep
                gainNode.gain.setValueAtTime(0.1, time)
                const startTime = time
                time += duration
                gainNode.gain.setValueAtTime(0, time)

                // Sync visual pulse
                const delay = (startTime - ctx.currentTime) * 1000
                const pulseDuration = duration * 1000
                setTimeout(() => {
                    if (!isStopped) {
                        const el = document.getElementById(`pulse-${id}`)
                        if (el) {
                            el.style.opacity = '1'
                            el.style.transform = 'scale(1.2)'
                            setTimeout(() => {
                                el.style.opacity = '0.3'
                                el.style.transform = 'scale(1)'
                            }, pulseDuration)
                        }
                    }
                }, delay)
                
                // Gap between dots/dashes
                time += unit
            }
            
            // Gap between characters (Total 5 units: 1 from loop + 4 here)
            time += unit * 4
            
            // Handle space between words (if any)
            if (char === ' ') time += unit * 4
        }

        // Auto stop after finished
        const totalDuration = (time - ctx.currentTime) * 1000
        setTimeout(() => {
            if (!isStopped && playingId === id) {
                setPlayingId(null)
            }
        }, totalDuration)
    }

    const playDemoTone = async (type: 'dot' | 'dash') => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        const ctx = audioCtxRef.current
        if (ctx.state === 'suspended') await ctx.resume()

        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()
        const unit = 0.12

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(600, ctx.currentTime)
        gainNode.gain.setValueAtTime(0, ctx.currentTime)
        
        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        const duration = type === 'dot' ? unit : unit * 3
        
        oscillator.start()
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
        gainNode.gain.setValueAtTime(0, ctx.currentTime + duration)
        
        setTimeout(() => {
            oscillator.stop()
            oscillator.disconnect()
            gainNode.disconnect()
        }, (duration + 0.1) * 1000)
    }

    const fireConfetti = () => {
        const duration = 5 * 1000
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
        setTerminalText(prev => [...prev, "> DECRYPT(KEY: '" + answer.toUpperCase() + "')"])
        
        try {
            const res = await fetch('/api/round5/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: answer.replace(/\s/g, '').toUpperCase() }),
            })
            const data = await res.json()
            
            if (data.passed) {
                setResult(data)
                setTerminalText(prev => [...prev, "SUCCESS: PAYLOAD DECRYPTED."])
                fireConfetti()
            } else {
                // The server response message is already formatted with [V1.1] if applicable
                setTerminalText(prev => [...prev, data.message || "ACCESS DENIED: INCORRECT KEY."])
                toast.error(data.message || 'Incorrect key.')
            }
        } catch { 
            toast.error('Signal lost. Try again.') 
            setTerminalText(prev => [...prev, "FATAL: SIGNAL CONNECTION LOST."])
        }
        finally { setSubmitting(false) }
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
            <div className="glass-card rounded-[2rem] p-12 border-2 border-green-500/30 bg-[#0a150a] relative overflow-hidden shadow-[0_0_80px_rgba(34,197,94,0.2)]">
                <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
                
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="w-28 h-28 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-500/50 relative z-10 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                    <Trophy size={56} className="text-green-400" />
                </motion.div>
                
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter relative z-10 font-mono italic">SYSTEM BREACHED</h2>
                <p className="text-green-400 text-xl mb-10 font-mono relative z-10 uppercase tracking-[0.3em] font-bold">Competition Complete</p>
                
                <div className="bg-black/80 border-2 border-green-500/20 rounded-2xl p-8 max-w-sm mx-auto relative z-10 space-y-4">
                     <p className="text-[10px] text-green-500/50 font-mono uppercase tracking-[0.5em]">Session Summary</p>
                     <div className="h-px bg-green-500/20 w-full" />
                     <div className="flex justify-between items-center px-4">
                        <span className="text-green-500/70 text-xs font-mono">TOTAL_TIME:</span>
                        <span className="text-2xl font-black text-white font-mono">{Math.round(result.total_time)}s</span>
                     </div>
                </div>
            </div>
            
            <button onClick={() => router.push('/dashboard')} className="px-10 py-4 bg-green-600/20 border-2 border-green-500/50 text-green-400 rounded-full hover:bg-green-600/40 transition-all font-mono uppercase tracking-[0.4em] font-black text-xs shadow-[0_0_20px_rgba(34,197,94,0.3)] group">
                <span className="group-hover:translate-x-1 inline-block transition-transform">RETURN_TO_BASE</span>
            </button>
        </motion.div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-8 relative">
            <MatrixRain color="#22c55e" opacity={0.1} speed={0.6} />
            
            {/* Header / Instructions */}
            <div className="text-center space-y-2 mb-10">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3 text-green-500 animate-pulse mb-2">
                    <Zap size={16} />
                    <span className="text-[10px] font-mono font-black tracking-[0.5em] uppercase">Phase_5: Radio_Intercept</span>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase">Signal <span className="text-green-500">Decryption</span></h1>
                <p className="text-green-500/60 font-mono text-xs uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
                    {problem?.instructions}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Signal Intercepts */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Radio size={14} className="text-green-500" />
                                <span className="text-[10px] font-mono font-bold text-green-500/70 uppercase tracking-widest">Active_Transmissions</span>
                            </div>
                            
                            {/* Morse Guide Toggle */}
                            <button 
                                onClick={() => setShowGuide(!showGuide)}
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all text-[9px] font-mono font-bold uppercase tracking-widest
                                    ${showGuide ? 'bg-green-500 text-black border-green-400' : 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20'}
                                `}
                            >
                                <BookOpen size={10} />
                                {showGuide ? 'CLOSE_GUIDE' : 'MORSE_GUIDE'}
                            </button>
                        </div>
                        
                        {/* Speed Selector */}
                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                            {[0.5, 1.0].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => {
                                        setPlaybackSpeed(speed)
                                        if (stopPlaybackRef.current) stopPlaybackRef.current()
                                    }}
                                    className={`px-2 py-1 text-[9px] font-mono rounded transition-all ${
                                        playbackSpeed === speed 
                                            ? 'bg-green-500 text-black font-bold' 
                                            : 'text-green-500/50 hover:text-green-500'
                                    }`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence>
                        {showGuide && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mb-4"
                            >
                                <div className="glass-card p-4 rounded-2xl border border-green-500/30 bg-green-500/5 space-y-4">
                                    <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
                                        <span className="text-[10px] font-mono font-black text-green-400 tracking-[0.2em]">DECODER_REFERENCE_HLP.EXE</span>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => playDemoTone('dot')} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[9px] font-mono text-green-500">
                                                <Music size={10} /> TEST_DOT (.)
                                            </button>
                                            <button onClick={() => playDemoTone('dash')} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-[9px] font-mono text-green-500">
                                                <Music size={10} /> TEST_DASH (-)
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                                        {Object.entries(MORSE_MAP).filter(([k]) => k !== ' ').slice(0, 26).map(([char, code]) => (
                                            <div key={char} className="flex flex-col items-center p-1.5 bg-black/40 rounded border border-white/5">
                                                <span className="text-xs font-black text-white">{char}</span>
                                                <span className="text-[8px] font-mono text-green-500/70 tracking-tight">{code}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[8px] font-mono text-green-500/40 italic">Decoding Logic: Dot = 1 unit, Dash = 3 units, Character Gap = 5 units.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    {problem?.signals.map((signal, index) => (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.15 }}
                            key={signal.id} 
                            className={`p-6 rounded-2xl border-2 flex items-center justify-between group transition-all duration-300
                                ${playingId === signal.id 
                                    ? 'border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.1)]' 
                                    : 'border-white/5 bg-white/[0.02] hover:border-green-500/30 hover:bg-white/[0.05]'}
                            `}
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border-2 transition-colors relative
                                    ${playingId === signal.id ? 'bg-green-500 border-green-400 text-black animate-pulse' : 'bg-white/5 border-white/10 text-green-500/40'}
                                `}>
                                    <Activity size={20} />
                                    {/* Visual Pulse Light */}
                                    <div 
                                        id={`pulse-${signal.id}`} 
                                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 opacity-30 border border-white/20 transition-all duration-75" 
                                    />
                                </div>
                                <div>
                                    <h3 className={`font-black font-mono tracking-tighter text-lg ${playingId === signal.id ? 'text-white' : 'text-white/60'}`}>
                                        {signal.label}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${playingId === signal.id ? 'bg-green-500 animate-ping' : 'bg-white/10'}`} />
                                        <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.3em]">
                                            {playingId === signal.id ? 'SYNCHRONIZING...' : 'SIGNAL_IDLE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => playMorse(signal.id)}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2
                                    ${playingId === signal.id 
                                        ? 'bg-red-500 border-red-400 text-white animate-pulse' 
                                        : 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-black hover:border-green-400'}
                                `}
                            >
                                {playingId === signal.id ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Right: Terminal & Input */}
                <div className="flex flex-col space-y-6">
                    <div className="flex items-center gap-2 mr-2 opacity-90 relative z-10">
                    <AlertTriangle size={14} className="text-green-500 animate-bounce" />
                    <span className="text-[10px] font-black font-mono text-green-500 tracking-[0.2em]">SYSTEM_BREACH_V1.1_DEBUG</span>
                </div>

                    <div className="bg-black/90 border-2 border-white/5 rounded-[2rem] p-6 h-[250px] font-mono text-[10px] flex flex-col justify-end relative overflow-hidden shadow-2xl">
                         {/* Scanlines */}
                        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 3px 100%' }} />
                        
                        <div className="space-y-1.5 relative z-10">
                            {terminalText.map((text, i) => (
                                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={text?.includes?.('SUCCESS') ? 'text-green-400 font-black italic' : text?.includes?.('DENIED') ? 'text-red-500 font-black' : 'text-green-500/60'}>
                                    {`>> ${text || ''}`}
                                </motion.div>
                            ))}
                            <div className="w-2 h-4 bg-green-500 animate-pulse inline-block align-middle ml-1" />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative group">
                             <input
                                type="text"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                                placeholder="ENTER_DECRYPTION_KEY"
                                className="w-full h-20 px-8 bg-white/[0.03] border-2 border-white/10 rounded-3xl text-green-400 font-mono text-xl placeholder:text-white/5 focus:outline-none focus:border-green-500/50 transition-all uppercase tracking-[0.5em] shadow-inner"
                                required
                                disabled={submitting}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 rounded-xl border border-white/10 group-focus-within:border-green-500/30 transition-colors">
                                <Zap size={20} className="text-white/20 group-focus-within:text-green-500" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!answer.trim() || submitting}
                            className={`w-full h-20 rounded-3xl font-black font-mono tracking-[0.5em] text-sm uppercase transition-all flex items-center justify-center gap-4 relative overflow-hidden border-2
                                ${answer.trim() && !submitting 
                                    ? 'bg-green-500 border-green-400 text-black shadow-[0_20px_40px_-10px_rgba(34,197,94,0.4)] hover:scale-[1.02] active:scale-[0.98]' 
                                    : 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed'}
                            `}
                        >
                            {submitting ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                "INITIATE_BYPASS"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

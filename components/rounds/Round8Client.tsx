'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ShieldCheck, AlertTriangle, RefreshCw, ArrowRight, Activity, Layers, Radiation, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Round8ClientProps {
    teamId: string
    isCompleted: boolean
}

interface WaveParams {
    freq: number
    amp: number
    phase: number
}

export default function Round8Client({ teamId, isCompleted: initialCompleted }: Round8ClientProps) {
    const router = useRouter()
    const [isSuccess, setIsSuccess] = useState(initialCompleted)
    const [loading, setLoading] = useState(false)
    const [currentLevel, setCurrentLevel] = useState(1)
    
    // Level 1 Params
    const [player1, setPlayer1] = useState<WaveParams>({ freq: 2, amp: 40, phase: 0 })
    const [target1, setTarget1] = useState<WaveParams>({ freq: 2.5, amp: 50, phase: 1 })
    
    // Level 2 Params (Secondary Wave)
    const [player2, setPlayer2] = useState<WaveParams>({ freq: 1, amp: 20, phase: 0 })
    const [target2, setTarget2] = useState<WaveParams>({ freq: 1.2, amp: 15, phase: 2 })

    // Level 3 Drift Offset
    const [drift, setDrift] = useState(0)
    
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number>(0)

    // Initialize Targets
    useEffect(() => {
        setTarget1({
            freq: 1.5 + Math.random() * 4,
            amp: 20 + Math.random() * 30,
            phase: Math.random() * Math.PI * 2
        })
        setTarget2({
            freq: 0.5 + Math.random() * 2,
            amp: 10 + Math.random() * 20,
            phase: Math.random() * Math.PI * 2
        })
    }, [currentLevel])

    // Level 3 Drift Loop
    useEffect(() => {
        if (currentLevel !== 3 || isSuccess) return
        
        let start = Date.now()
        const updateDrift = () => {
            const time = (Date.now() - start) / 1000
            setDrift(Math.sin(time * 0.5) * 0.5) // Drifts frequency slightly
            requestRef.current = requestAnimationFrame(updateDrift)
        }
        requestRef.current = requestAnimationFrame(updateDrift)
        return () => cancelAnimationFrame(requestRef.current)
    }, [currentLevel, isSuccess])

    const getWaveY = (x: number, width: number, params: WaveParams, driftVal = 0) => {
        const freq = params.freq + driftVal
        return params.amp * Math.sin((x / width) * Math.PI * 2 * freq + params.phase)
    }

    // Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationFrame: number
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            const centerY = canvas.height / 2
            const width = canvas.width
            
            // Draw Target Wave
            ctx.beginPath()
            ctx.strokeStyle = 'rgba(163, 230, 53, 0.15)'
            ctx.lineWidth = 6
            for (let x = 0; x < width; x++) {
                let y = centerY + getWaveY(x, width, target1, currentLevel === 3 ? drift : 0)
                if (currentLevel >= 2) y += getWaveY(x, width, target2)
                
                if (x === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            // Draw Player Wave
            ctx.beginPath()
            ctx.strokeStyle = '#a3e635'
            ctx.lineWidth = 3
            ctx.shadowBlur = 10
            ctx.shadowColor = '#84cc16'
            
            for (let x = 0; x < width; x++) {
                let y = centerY + getWaveY(x, width, player1)
                if (currentLevel >= 2) y += getWaveY(x, width, player2)
                
                if (x === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()
            ctx.shadowBlur = 0

            animationFrame = requestAnimationFrame(render)
        }
        render()
        return () => cancelAnimationFrame(animationFrame)
    }, [player1, player2, target1, target2, currentLevel, drift, isSuccess])

    const checkMatch = () => {
        const m1 = 
            Math.abs(player1.freq - (target1.freq + (currentLevel === 3 ? drift : 0))) < 0.15 &&
            Math.abs(player1.amp - target1.amp) < 5 &&
            Math.abs(Math.sin(player1.phase) - Math.sin(target1.phase)) < 0.2

        if (currentLevel === 1) return m1

        const m2 = 
            Math.abs(player2.freq - target2.freq) < 0.15 &&
            Math.abs(player2.amp - target2.amp) < 5 &&
            Math.abs(Math.sin(player2.phase) - Math.sin(target2.phase)) < 0.2

        return m1 && m2
    }

    const isMatch = checkMatch()

    const handleSync = async () => {
        if (!isMatch) {
            toast.error("Signal integrity critical. Phase alignment required.")
            return
        }

        if (currentLevel < 3) {
            toast.success(`Level ${currentLevel} Synchronized. Expanding signal range...`)
            setCurrentLevel(prev => prev + 1)
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/round8/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, solved: true })
            })

            const data = await res.json()
            if (data.success) {
                setIsSuccess(true)
                toast.success("Omni-Frequency Lock Established. Mission Secure.")
                setTimeout(() => router.push('/dashboard'), 2000)
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            toast.error("Transmission error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 glass-card border-lime-500/20 bg-lime-500/5 rounded-2xl relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-lime-500/20 rounded-xl">
                        <Activity className={`text-lime-400 ${!isSuccess ? 'animate-pulse' : ''}`} size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Frequency Sync</h2>
                        <div className="flex items-center gap-2">
                            <Layers size={12} className="text-lime-400" />
                            <p className="text-lime-400/60 text-[10px] font-mono uppercase tracking-[0.2em]">Level {currentLevel} / 3: {currentLevel === 1 ? 'Carrier Sync' : currentLevel === 2 ? 'Modulation Match' : 'Quantum Tracking'}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="flex gap-1">
                        {[1, 2, 3].map(l => (
                            <div key={l} className={`w-8 h-1 rounded-full transition-all duration-500 ${l <= currentLevel ? 'bg-lime-500 shadow-glow-lime' : 'bg-white/10'}`} />
                        ))}
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Link Integrity</span>
                        <span className={`text-sm font-black font-mono uppercase tracking-tighter ${isMatch ? 'text-lime-400' : 'text-yellow-500'}`}>
                            {isSuccess ? 'SECURE' : isMatch ? 'LOCKED' : 'DRIFTING'}
                        </span>
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Visualizer */}
            <div className="relative p-8 glass-card rounded-[2.5rem] border-white/5 bg-black/40 overflow-hidden flex items-center justify-center min-h-[400px]">
                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={300} 
                    className="w-full h-auto max-w-2xl opacity-100 transition-opacity duration-1000"
                />
                
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'linear-gradient(#84cc16 1px, transparent 1px), linear-gradient(90#84cc16 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {currentLevel === 3 && !isMatch && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 text-red-500/60 animate-pulse">
                        <Radiation size={16} />
                        <span className="text-[10px] font-mono font-black uppercase tracking-widest italic">Signal Drift Active</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="space-y-6">
                {/* Primary Wave Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Carrier Freq', key: 'freq', min: 1, max: 8, step: 0.01, target: player1, setter: setPlayer1 },
                        { label: 'Carrier Amp', key: 'amp', min: 10, max: 80, step: 1, target: player1, setter: setPlayer1 },
                        { label: 'Carrier Phase', key: 'phase', min: 0, max: Math.PI * 2, step: 0.1, target: player1, setter: setPlayer1 }
                    ].map((control) => (
                        <div key={control.label} className="glass-card p-6 rounded-2xl border-white/5 bg-black/40 space-y-4 hover:border-lime-500/20 transition-all group">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-lime-400 group-hover:text-white transition-colors uppercase tracking-widest">{control.label}</span>
                                <span className="text-[10px] font-mono text-white/40 italic">{(control.target as any)[control.key].toFixed(2)}</span>
                            </div>
                            <input 
                                type="range"
                                min={control.min}
                                max={control.max}
                                step={control.step}
                                value={(control.target as any)[control.key]}
                                disabled={isSuccess}
                                onChange={(e) => control.setter(p => ({ ...p, [control.key]: parseFloat(e.target.value) }))}
                                className="w-full accent-lime-500 bg-white/5 rounded-lg appearance-none h-1.5 cursor-pointer"
                            />
                        </div>
                    ))}
                </div>

                {/* Secondary Wave Controls (Visible in Level 2+) */}
                <AnimatePresence>
                    {currentLevel >= 2 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {[
                                { label: 'Mod Freq', key: 'freq', min: 0.5, max: 4, step: 0.01, target: player2, setter: setPlayer2 },
                                { label: 'Mod Amp', key: 'amp', min: 5, max: 40, step: 1, target: player2, setter: setPlayer2 },
                                { label: 'Mod Phase', key: 'phase', min: 0, max: Math.PI * 2, step: 0.1, target: player2, setter: setPlayer2 }
                            ].map((control) => (
                                <div key={control.label} className="glass-card p-6 rounded-2xl border-white/5 bg-black/60 space-y-4 border-lime-500/10 hover:border-lime-500/30 transition-all">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-lime-200 uppercase tracking-widest">{control.label}</span>
                                        <span className="text-[10px] font-mono text-white/40 italic">{(control.target as any)[control.key].toFixed(2)}</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min={control.min}
                                        max={control.max}
                                        step={control.step}
                                        value={(control.target as any)[control.key]}
                                        disabled={isSuccess}
                                        onChange={(e) => control.setter(p => ({ ...p, [control.key]: parseFloat(e.target.value) }))}
                                        className="w-full accent-lime-400 bg-white/5 rounded-lg appearance-none h-1.5 cursor-pointer"
                                    />
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Submit Action */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 glass-card rounded-2xl border-white/5 bg-black/40">
                <div className="flex items-center gap-3 text-lime-400/60 max-w-lg">
                    <Lock size={16} className={isMatch ? 'text-lime-400' : ''} />
                    <span className="text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                        {currentLevel === 1 ? 'Level 1: Match the base carrier wave.' : 
                         currentLevel === 2 ? 'Level 2: Match the composite signal (Carrier + Modulation).' : 
                         'Level 3: Signal is drifting! Track the target fluctuations and sync during alignment.'}
                    </span>
                </div>

                <motion.button
                    whileHover={isMatch && !isSuccess ? { scale: 1.02 } : {}}
                    whileTap={isMatch && !isSuccess ? { scale: 0.98 } : {}}
                    onClick={handleSync}
                    disabled={!isMatch || isSuccess || loading}
                    className={`
                        px-10 py-5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all min-w-[220px] justify-center
                        ${isMatch && !isSuccess 
                            ? 'bg-lime-500 text-black shadow-glow-lime' 
                            : isSuccess ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30'
                            : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}
                    `}
                >
                    {isSuccess ? (
                        <>SIGNAL SECURED <ShieldCheck size={14} /></>
                    ) : (
                        <>
                            {currentLevel < 3 ? 'PROCEED TO NEXT BAND' : 'FINALIZE LINK LOCK'} 
                            <ArrowRight size={14} className={loading || isMatch ? 'animate-pulse' : ''} />
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    )
}

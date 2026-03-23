'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ShieldCheck, AlertTriangle, Cpu, Atom, ArrowRight, RefreshCw, Trophy, Target, Sparkles, Orbit, Server, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Round10ClientProps {
    teamId: string
    isCompleted: boolean
}

interface Pulse {
    id: string
    x: number
    y: number
    vx: number
    vy: number
    reflected: boolean
    speed: number
    color: string
}

interface Particle {
    id: string
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
}

const GDG_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'] // Blue, Red, Yellow, Green

export default function Round10Client({ teamId, isCompleted: initialCompleted }: Round10ClientProps) {
    const router = useRouter()
    const [isSuccess, setIsSuccess] = useState(initialCompleted)
    const [loading, setLoading] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [hits, setHits] = useState(0)
    const [shake, setShake] = useState(0)
    const [glitch, setGlitch] = useState(false)
    
    const TARGET_HITS = 40
    const CORE_RADIUS = 60
    const SHIELD_RADIUS = 120
    const SHIELD_WIDTH = 0.8 // Radians
    
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number>(0)
    const lastSpawnRef = useRef<number>(0)
    const pulsesRef = useRef<Pulse[]>([])
    const particlesRef = useRef<Particle[]>([])
    const mousePos = useRef({ x: 0, y: 0 })
    const shieldAngleRef = useRef(0)

    const spawnPulse = useCallback((canvas: HTMLCanvasElement) => {
        const angle = Math.random() * Math.PI * 2
        const id = Math.random().toString(36).substr(2, 9)
        const speed = 2 + (hits * 0.05)
        const color = GDG_COLORS[Math.floor(Math.random() * GDG_COLORS.length)]
        
        pulsesRef.current.push({
            id,
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            reflected: false,
            speed,
            color
        })
    }, [hits])

    const createExplosion = (x: number, y: number, color: string, count = 10) => {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = 1 + Math.random() * 3
            particlesRef.current.push({
                id: Math.random().toString(36),
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color
            })
        }
    }

    const gameLoop = useCallback((time: number) => {
        const canvas = canvasRef.current
        if (!canvas || !gameStarted || isSuccess) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Update Shield Angle (Mouse follow)
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const targetAngle = Math.atan2(mousePos.current.y - centerY, mousePos.current.x - centerX)
        shieldAngleRef.current = targetAngle

        // Clear and Shake
        ctx.save()
        if (shake > 0) {
            ctx.translate(Math.random() * shake - shake/2, Math.random() * shake - shake/2)
            setShake(s => Math.max(0, s - 0.5))
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw Circuit Background Lattice
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.05)'
        ctx.lineWidth = 1
        for(let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2
            ctx.moveTo(centerX + Math.cos(angle) * CORE_RADIUS, centerY + Math.sin(angle) * CORE_RADIUS)
            ctx.lineTo(centerX + Math.cos(angle) * 1000, centerY + Math.sin(angle) * 1000)
        }
        ctx.stroke()

        // Spawn
        const spawnRate = Math.max(300, 1000 - hits * 20)
        if (time - lastSpawnRef.current > spawnRate) {
            spawnPulse(canvas)
            lastSpawnRef.current = time
        }

        // Update Pulses
        pulsesRef.current = pulsesRef.current.filter(p => {
            p.x += p.vx
            p.y += p.vy

            const dist = Math.sqrt((p.x - centerX)**2 + (p.y - centerY)**2)

            // Shield Collision
            if (!p.reflected && dist >= SHIELD_RADIUS - 5 && dist <= SHIELD_RADIUS + 5) {
                const angle = Math.atan2(p.y - centerY, p.x - centerX)
                let diff = angle - shieldAngleRef.current
                while (diff < -Math.PI) diff += Math.PI * 2
                while (diff > Math.PI) diff -= Math.PI * 2
                
                if (Math.abs(diff) < SHIELD_WIDTH / 2) {
                    p.reflected = true
                    p.vx *= -1.5 
                    p.vy *= -1.5
                    createExplosion(p.x, p.y, p.color, 8)
                    setShake(5)
                }
            }

            // Core Collision (Reflected only)
            if (p.reflected && dist <= CORE_RADIUS) {
                setHits(h => {
                    const next = h + 1
                    if (next >= TARGET_HITS && !isSuccess) handleComplete()
                    return next
                })
                createExplosion(p.x, p.y, '#ffffff', 20)
                setShake(12)
                setGlitch(true)
                setTimeout(() => setGlitch(false), 100)
                return false
            }

            // Expiry
            return p.x > -100 && p.x < canvas.width + 100 && p.y > -100 && p.y < canvas.height + 100
        })

        // Particles
        particlesRef.current = particlesRef.current.filter(p => {
            p.x += p.vx
            p.y += p.vy
            p.life -= 0.02
            return p.life > 0
        })

        // Draw Core
        ctx.beginPath()
        ctx.arc(centerX, centerY, CORE_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = glitch ? 'rgba(255, 255, 255, 0.9)' : '#10b981'
        ctx.shadowBlur = hits > 30 ? 50 : 25
        ctx.shadowColor = '#34d399'
        ctx.fill()
        
        // GDG Orbiting Circles
        for(let i = 0; i < 4; i++) {
            const orbitAngle = (time / 1000) + (i * Math.PI / 2)
            const orbitDist = CORE_RADIUS + 25 + Math.sin(time / 500) * 10
            const ox = centerX + Math.cos(orbitAngle) * orbitDist
            const oy = centerY + Math.sin(orbitAngle) * orbitDist
            ctx.beginPath()
            ctx.arc(ox, oy, 8, 0, Math.PI * 2)
            ctx.fillStyle = GDG_COLORS[i]
            ctx.fill()
        }

        // Draw Shield (IEEE PES Style)
        ctx.beginPath()
        ctx.arc(centerX, centerY, SHIELD_RADIUS, shieldAngleRef.current - SHIELD_WIDTH/2, shieldAngleRef.current + SHIELD_WIDTH/2)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 10
        ctx.lineCap = 'round'
        ctx.shadowBlur = 20
        ctx.shadowColor = '#ffffff'
        ctx.stroke()

        // Draw Pulses
        pulsesRef.current.forEach(p => {
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.reflected ? 7 : 5, 0, Math.PI * 2)
            ctx.fillStyle = p.reflected ? '#ffffff' : p.color
            ctx.shadowBlur = p.reflected ? 15 : 10
            ctx.shadowColor = p.reflected ? '#ffffff' : p.color
            ctx.fill()
        })

        // Draw Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.life
            ctx.fillStyle = p.color
            ctx.fillRect(p.x, p.y, 4, 4)
        })
        ctx.globalAlpha = 1.0

        ctx.restore()
        requestRef.current = requestAnimationFrame(gameLoop)
    }, [gameStarted, isSuccess, hits, spawnPulse])

    useEffect(() => {
        if (gameStarted && !isSuccess) {
            requestRef.current = requestAnimationFrame(gameLoop)
        }
        return () => cancelAnimationFrame(requestRef.current)
    }, [gameStarted, isSuccess, gameLoop])

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        
        let clientX, clientY
        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }
        
        mousePos.current = {
            x: ((clientX - rect.left) / rect.width) * canvas.width,
            y: ((clientY - rect.top) / rect.height) * canvas.height
        }
    }

    const handleComplete = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/round10/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, hits: TARGET_HITS })
            })

            const data = await res.json()
            if (data.success) {
                setIsSuccess(true)
                toast.success("GDG x IEEE PES: System Stabilized.", {
                    icon: <ShieldCheck className="text-emerald-400" />
                })
                setTimeout(() => router.push('/dashboard'), 4000)
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            toast.error("Network synchronization lost.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 select-none">
            {/* GDG x IEEE PES HUD */}
            <div className={`p-6 glass-card rounded-2xl transition-all duration-300 relative overflow-hidden ${glitch ? 'bg-white/90' : 'border-emerald-500/30 bg-black/40'}`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="flex -space-x-3">
                            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 backdrop-blur-md">
                                <Server className="text-emerald-400" size={24} />
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 backdrop-blur-md">
                                <Share2 className="text-blue-400" size={24} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/20">GDG</span>
                                <span className="text-white/20 text-xs font-mono">×</span>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20">IEEE PES</span>
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Smart-Grid Stabilizer</h2>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-12">
                        <div className="text-center">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1 tracking-[0.2em]">Stability_Delta</span>
                            <div className="text-4xl font-black font-mono text-emerald-400 italic tracking-tighter drop-shadow-glow">
                                {Math.floor((hits/TARGET_HITS)*100)}%
                            </div>
                        </div>
                        <div className="text-center min-w-[160px]">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-2 tracking-[0.2em]">Harmonic_Index</span>
                            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-glow-emerald rounded-full"
                                    animate={{ width: `${(hits / TARGET_HITS) * 100}%` }}
                                    transition={{ type: 'spring', stiffness: 50 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Decorative Brand Colors Strip */}
                <div className="absolute top-0 left-0 right-0 h-1 flex">
                    {GDG_COLORS.map(c => <div key={c} className="flex-1" style={{ backgroundColor: c }} />)}
                </div>
            </div>

            {/* Battle Arena */}
            <div 
                className={`relative h-[550px] glass-card rounded-[3rem] border-white/5 bg-[#020617] overflow-hidden flex flex-col items-center justify-center cursor-none transition-all duration-75 ${glitch ? 'brightness-150 saturate-200' : ''}`}
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
            >
                {/* High-Tech Background Elements */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2)_0%,transparent_70%)]" />
                </div>

                <canvas 
                    ref={canvasRef} 
                    width={800} 
                    height={550} 
                    className="w-full h-full relative z-10"
                />

                <AnimatePresence>
                    {!gameStarted && !isSuccess && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center space-y-12"
                        >
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-[2px] w-12 bg-blue-500" />
                                    <Atom className="text-emerald-400 animate-spin-slow" size={48} />
                                    <div className="h-[2px] w-12 bg-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">Final Protocol</h3>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-blue-400 font-mono text-[10px] uppercase font-black px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">GDG SOFTWARE</span>
                                        <span className="text-white/20">+</span>
                                        <span className="text-emerald-400 font-mono text-[10px] uppercase font-black px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">IEEE PES ENERGY</span>
                                    </div>
                                </div>
                            </div>
                            
                            <motion.button
                                whileHover={{ scale: 1.05, letterSpacing: '0.4em' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setGameStarted(true)}
                                className="px-16 py-8 bg-white text-black font-black uppercase tracking-widest text-lg rounded-[2.5rem] shadow-glow-white flex items-center gap-4 italic group transition-all"
                            >
                                START SYSTEM SYNC <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                            </motion.button>

                            <div className="grid grid-cols-3 gap-12 opacity-50">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center"><Target size={20} /></div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-white">Active Filter</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center"><Zap size={20} /></div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-white">Distortion Block</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center"><Cpu size={20} /></div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-white">Grid Lock</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {isSuccess && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-50 bg-[#020617]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-12 text-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="mb-12 relative"
                            >
                                <div className="absolute inset-0 blur-3xl bg-emerald-500/30 rounded-full scale-150 animate-pulse" />
                                <Trophy size={140} className="text-yellow-400 relative z-10 drop-shadow-glow" />
                            </motion.div>
                            
                            <div className="space-y-4 mb-16">
                                <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-none">MISSION_SECURED</h2>
                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-emerald-400 font-mono text-xs tracking-[0.6em] uppercase animate-pulse">SMART GRID STABILIZED</span>
                                </div>
                            </div>
                            
                            <div className="p-8 glass-card border-white/10 bg-white/5 rounded-3xl max-w-lg mb-8">
                                <p className="text-white/60 font-mono text-[11px] leading-relaxed uppercase tracking-widest">
                                    The collaboration between <span className="text-blue-400 font-black">Google Developer Groups</span> and <span className="text-emerald-400 font-black">IEEE PES</span> has successfully restored power to the global network. 
                                    Mission finalized. Final stats compiling...
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(52,211,153,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,0.3)_1px,transparent_1px)] bg-[size:40px_40px] z-20" />
            </div>

            {/* Instruction Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 glass-card rounded-3xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-4 text-emerald-400/80 flex-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] leading-relaxed font-bold italic">
                        PROTOCOL: Intercept "Harmonic Distortions" (Data Bursts) and reflect them back to the center hub. This joint-mission requires precision stabilization.
                    </span>
                </div>

                <div className="flex items-center gap-12">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em] mb-1">Affiliation</span>
                        <span className="text-xs font-black font-mono italic text-emerald-200 uppercase">GDG x IEEE PES</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Trophy, RefreshCcw, Play, Activity, Gauge, ZapOff } from 'lucide-react'

interface PowerRunnerProps {
    minScore: number
    onComplete: (score: number) => void
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    color: string
}

interface Obstacle {
    x: number
    width: number
    height: number
    type: 'flare' | 'spike'
}

export default function Round4PowerRunner({ minScore, onComplete }: PowerRunnerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const requestRef = useRef<number>()

    // Game Constants
    const CANVAS_WIDTH = 800
    const CANVAS_HEIGHT = 200
    const GROUND_Y = 170
    const PLAYER_X = 80
    const PLAYER_SIZE = 24
    const GRAVITY = 0.55
    const JUMP_FORCE = -11
    const SPEED_INCREMENT = 0.0008
    const INITIAL_SPEED = 6

    // Game Variables
    const playerY = useRef(GROUND_Y - PLAYER_SIZE)
    const playerVY = useRef(0)
    const isJumping = useRef(false)
    const obstacles = useRef<Obstacle[]>([])
    const particles = useRef<Particle[]>([])
    const trail = useRef<{ y: number; opacity: number }[]>([])
    const gameSpeed = useRef(INITIAL_SPEED)
    const currentScore = useRef(0)
    const bgOffset = useRef(0)
    const shakeTime = useRef(0)

    const initGame = () => {
        playerY.current = GROUND_Y - PLAYER_SIZE
        playerVY.current = 0
        isJumping.current = false
        obstacles.current = []
        particles.current = []
        trail.current = []
        gameSpeed.current = INITIAL_SPEED
        currentScore.current = 0
        bgOffset.current = 0
        shakeTime.current = 0
        setScore(0)
    }

    const jump = () => {
        if (!isJumping.current && gameState === 'playing') {
            playerVY.current = JUMP_FORCE
            isJumping.current = true
            // Create jump particles
            for (let i = 0; i < 8; i++) {
                particles.current.push({
                    x: PLAYER_X + PLAYER_SIZE / 2,
                    y: GROUND_Y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 3,
                    life: 1.0,
                    color: '#f59e0b'
                })
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault()
                if (gameState === 'playing') jump()
                else if (gameState === 'idle') startGame()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [gameState])

    const startGame = () => {
        initGame()
        setStatus('playing')
        setGameState('playing')
    }

    // Wrap status change for sound/effects if needed
    const [status, setStatus] = useState<'idle' | 'playing' | 'gameover'>('idle')

    const update = (time: number) => {
        if (gameState !== 'playing') return

        // 1. Update Player Physics
        playerVY.current += GRAVITY
        playerY.current += playerVY.current

        if (playerY.current > GROUND_Y - PLAYER_SIZE) {
            playerY.current = GROUND_Y - PLAYER_SIZE
            playerVY.current = 0
            isJumping.current = false
        }

        // 2. Update Trail
        trail.current.unshift({ y: playerY.current, opacity: 0.6 })
        if (trail.current.length > 12) trail.current.pop()
        trail.current.forEach(t => t.opacity *= 0.85)

        // 3. Update Background Offset
        bgOffset.current = (bgOffset.current + gameSpeed.current) % CANVAS_WIDTH

        // 4. Update Obstacles
        if (obstacles.current.length === 0 || (CANVAS_WIDTH - (obstacles.current[obstacles.current.length - 1].x)) > (300 + Math.random() * 200)) {
            if (Math.random() > 0.98 || obstacles.current.length === 0) {
                obstacles.current.push({
                    x: CANVAS_WIDTH,
                    width: 25 + Math.random() * 20,
                    height: 35 + Math.random() * 40,
                    type: Math.random() > 0.5 ? 'spike' : 'flare'
                })
            }
        }

        obstacles.current.forEach((obs, index) => {
            obs.x -= gameSpeed.current

            // Precise Collision Detection
            const px = PLAYER_X + 8
            const py = playerY.current + 4
            const pw = PLAYER_SIZE - 16
            const ph = PLAYER_SIZE - 8

            const ox = obs.x + 4
            const oy = GROUND_Y - obs.height + 4
            const ow = obs.width - 8
            const oh = obs.height - 4

            if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
                setGameState('gameover')
                setHighScore(prev => Math.max(prev, Math.floor(currentScore.current)))
                shakeTime.current = 15
            }
        })

        obstacles.current = obstacles.current.filter(obs => obs.x + obs.width > 0)

        // 5. Update Particles
        particles.current.forEach(p => {
            p.x += p.vx - gameSpeed.current * 0.2
            p.y += p.vy
            p.life -= 0.02
        })
        particles.current = particles.current.filter(p => p.life > 0)

        // 6. Progress
        gameSpeed.current += SPEED_INCREMENT
        currentScore.current += 0.15
        setScore(Math.floor(currentScore.current))

        if (shakeTime.current > 0) shakeTime.current--

        draw()
        requestRef.current = requestAnimationFrame(update)
    }

    const draw = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx || !canvas) return

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        // Screen Shake Apply
        ctx.save()
        if (shakeTime.current > 0) {
            ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6)
        }

        // Draw Parallax BG (Far - Circuits)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)'
        ctx.setLineDash([20, 10])
        for(let i = 0; i < 5; i++) {
            ctx.beginPath()
            ctx.moveTo(0, 30 + i * 40)
            ctx.lineTo(CANVAS_WIDTH, 30 + i * 40)
            ctx.stroke()
        }
        ctx.setLineDash([])

        // Draw scrolling grid
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.1)'
        ctx.lineWidth = 1
        const gridSize = 40
        for (let x = -bgOffset.current % gridSize; x < CANVAS_WIDTH; x += gridSize) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, GROUND_Y)
            ctx.stroke()
        }

        // Draw Ground
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.2
        ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`
        ctx.lineWidth = 3
        ctx.shadowBlur = 10
        ctx.shadowColor = '#f59e0b'
        ctx.beginPath()
        ctx.moveTo(0, GROUND_Y)
        ctx.lineTo(CANVAS_WIDTH, GROUND_Y)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Draw Trail
        trail.current.forEach((t, i) => {
            ctx.fillStyle = `rgba(245, 158, 11, ${t.opacity * 0.3})`
            ctx.beginPath()
            ctx.roundRect(PLAYER_X - (i * 4), t.y, PLAYER_SIZE, PLAYER_SIZE, 4)
            ctx.fill()
        })

        // Draw Particles
        particles.current.forEach(p => {
            ctx.fillStyle = p.color
            ctx.globalAlpha = p.life
            ctx.beginPath()
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
            ctx.fill()
        })
        ctx.globalAlpha = 1.0

        // Draw Player (The Energy Core)
        ctx.fillStyle = '#f59e0b'
        ctx.shadowBlur = 20
        ctx.shadowColor = '#f59e0b'
        ctx.beginPath()
        ctx.roundRect(PLAYER_X, playerY.current, PLAYER_SIZE, PLAYER_SIZE, 6)
        ctx.fill()
        
        // Core highlight
        ctx.fillStyle = '#fff'
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(PLAYER_X + PLAYER_SIZE * 0.7, playerY.current + PLAYER_SIZE * 0.3, 3, 0, Math.PI * 2)
        ctx.fill()

        // Draw Obstacles (Voltage Spikes)
        obstacles.current.forEach(obs => {
            const grad = ctx.createLinearGradient(0, GROUND_Y - obs.height, 0, GROUND_Y)
            grad.addColorStop(0, '#ef4444')
            grad.addColorStop(1, '#7f1d1d')
            
            ctx.fillStyle = grad
            ctx.shadowBlur = 15
            ctx.shadowColor = '#ef4444'
            
            ctx.beginPath()
            if (obs.type === 'spike') {
                ctx.moveTo(obs.x, GROUND_Y)
                ctx.lineTo(obs.x + obs.width / 2, GROUND_Y - obs.height)
                ctx.lineTo(obs.x + obs.width, GROUND_Y)
            } else {
                ctx.roundRect(obs.x, GROUND_Y - obs.height, obs.width, obs.height, 4)
            }
            ctx.fill()
            
            // Electricity internal effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(obs.x + obs.width/2, GROUND_Y - obs.height + 5)
            ctx.lineTo(obs.x + 5, GROUND_Y - 5)
            ctx.lineTo(obs.x + obs.width - 5, GROUND_Y - 10)
            ctx.stroke()
        })
        
        ctx.restore()
    }

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(update)
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            draw()
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [gameState])

    return (
        <div className="flex flex-col items-center space-y-6 w-full max-w-4xl mx-auto">
            {/* Top HUD */}
            <div className="grid grid-cols-3 w-full px-6 py-4 glass-card bg-[#0A0A0A]/60 border border-white/5 rounded-2xl items-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                
                <div className="space-y-1">
                    <p className="text-[10px] font-mono text-amber-500/50 uppercase tracking-[0.3em] font-black">Sync_Quota</p>
                    <div className="flex items-center gap-2">
                        <Gauge size={14} className="text-amber-500" />
                        <p className="text-2xl font-black text-amber-500 font-mono tracking-tighter italic drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                            {minScore}
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <div className={`relative inline-block ${gameState === 'playing' ? 'animate-bounce' : ''}`}>
                        <Zap className={`mx-auto mb-1 ${gameState === 'playing' ? 'text-amber-400 drop-shadow-[0_0_10px_#f59e0b]' : 'text-zinc-600'}`} size={32} />
                        {gameState === 'playing' && (
                            <motion.div 
                                className="absolute -inset-2 bg-amber-500/20 rounded-full blur-xl"
                                animate={{ opacity: [0.2, 0.5, 0.2] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                            />
                        )}
                    </div>
                    <p className="text-[9px] font-mono font-black text-white/40 uppercase tracking-[0.4em] mt-1 italic">PES_Surge_Link_v2.0</p>
                </div>

                <div className="text-right space-y-1">
                    <p className="text-[10px] font-mono text-amber-500/50 uppercase tracking-[0.3em] font-black">Current_Flow</p>
                    <div className="flex items-center justify-end gap-2 text-white">
                        <Activity size={14} className={gameState === 'playing' ? 'text-green-500 animate-pulse' : 'text-zinc-600'} />
                        <p className="text-2xl font-black font-mono tracking-tighter italic">
                            {score.toString().padStart(4, '0')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Game Canvas Container */}
            <div 
                className={`relative w-full aspect-[4/1] bg-black/90 border-2 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-500
                    ${gameState === 'playing' ? 'border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.1)]' : 'border-white/10'}
                `}
                onClick={jump}
            >
                {/* Visual Overlays */}
                <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none" />
                
                {/* CRT Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.15] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                <canvas 
                    ref={canvasRef} 
                    width={CANVAS_WIDTH} 
                    height={CANVAS_HEIGHT} 
                    className="w-full h-full cursor-pointer relative z-10"
                />

                <AnimatePresence>
                    {gameState === 'idle' && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-30"
                        >
                            <div className="relative mb-6">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -inset-4 bg-amber-500/20 rounded-full blur-2xl" />
                                <Play className="text-amber-500 relative z-10" size={64} fill="currentColor" />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2 font-mono drop-shadow-2xl">Initialize Synchronizer</h3>
                            <p className="text-[10px] text-amber-500/60 font-mono tracking-[0.4em] uppercase font-black">Press SPACE or Click to Deploy</p>
                        </motion.div>
                    )}

                    {gameState === 'gameover' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl z-30 p-8"
                        >
                            <ZapOff className="text-red-500 mb-4 animate-pulse" size={64} />
                            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2 scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">GRID COLLAPSE</h3>
                            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent my-4" />
                            
                            <p className="text-red-400 text-xs font-mono tracking-[0.3em] uppercase mb-8 font-black">
                                Flow Disconnected at {score} Sync_Units
                            </p>
                            
                            <div className="flex gap-6 scale-110">
                                <button 
                                    onClick={startGame}
                                    className="group px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:border-amber-500/50 transition-all flex items-center gap-3"
                                >
                                    <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" /> REBOOT_GRID
                                </button>
                                
                                {score >= minScore && (
                                    <button 
                                        onClick={() => onComplete(score)}
                                        className="px-8 py-3 bg-amber-500 text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                                    >
                                        <Trophy size={16} /> SECURE_UPLINK
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Info Bar */}
            <div className="w-full grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl border border-white/5 bg-black/40 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <Gauge size={14} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Max_Sync_Achieved</p>
                            <p className="text-sm font-black font-mono text-blue-400 italic tracking-tighter">{highScore.toString().padStart(4, '0')}</p>
                        </div>
                    </div>
                    {score >= minScore && <CheckCircle className="text-green-500" size={16} />}
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/5 bg-black/40 flex items-center gap-3">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1.5 px-1">
                            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Handshake_Progress</span>
                            <span className={`text-[8px] font-mono font-black uppercase ${score >= minScore ? 'text-green-400' : 'text-amber-500'}`}>
                                {Math.floor(Math.min(100, (score / minScore) * 100))}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5">
                            <motion.div 
                                className={`h-full rounded-full ${score >= minScore ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (score / minScore) * 100)}%` }}
                                transition={{ type: 'spring', bounce: 0 }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CheckCircle({ className, size }: { className?: string, size?: number }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}

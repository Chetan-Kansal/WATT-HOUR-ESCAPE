'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ShieldCheck, AlertTriangle, Cpu, Gavel, ArrowRight, XCircle, Target, Keyboard, MousePointer2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Round9ClientProps {
    teamId: string
    isCompleted: boolean
}

interface Packet {
    id: string
    x: number
    y: number
    speed: number
    size: number
    type: 'normal' | 'fast' | 'tank'
    word?: string
}

const TECH_WORDS = [
    'REACT', 'NEXTJS', 'NODE', 'CSS', 'HTML', 'TYPESCRIPT', 'PRISMA', 'SUPABASE', 
    'GIT', 'DOCKER', 'K8S', 'API', 'REST', 'GRAPHQL', 'REDUX', 'ZUSTAND', 
    'TAILWIND', 'FRAMER', 'MOTION', 'VITE', 'POSTGRES', 'REDIS', 'MONGO', 'SQL'
]

export default function Round9Client({ teamId, isCompleted: initialCompleted }: Round9ClientProps) {
    const router = useRouter()
    const [isSuccess, setIsSuccess] = useState(initialCompleted)
    const [loading, setLoading] = useState(false)
    const [currentLevel, setCurrentLevel] = useState(1)
    const [packets, setPackets] = useState<Packet[]>([])
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [health, setHealth] = useState(100)
    const [currentInput, setCurrentInput] = useState('')
    
    const requestRef = useRef<number>(0)
    const lastSpawnRef = useRef<number>(0)
    
    const TARGET_SCORE_L1 = 20
    const TARGET_SCORE_L2 = 20
    const HEALTH_DECREMENT = 10 

    const spawnPacket = useCallback(() => {
        const id = Math.random().toString(36).substr(2, 9)
        const x = 10 + Math.random() * 80
        
        const rand = Math.random()
        let type: Packet['type'] = 'normal'
        let speed = currentLevel === 1 ? (0.6 + score * 0.02) : (0.4 + score * 0.015)
        let size = 60
        let word: string | undefined

        if (currentLevel === 2) {
            word = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)]
            size = 80 // Larger for text
        } else {
            if (rand > 0.8) {
                type = 'fast'
                speed *= 1.8
                size = 45
            } else if (rand > 0.6) {
                type = 'tank'
                speed *= 0.5
                size = 80
            }
        }

        setPackets(prev => [...prev, { id, x, y: -10, speed, size, type, word }])
    }, [score, currentLevel])

    const gameLoop = useCallback((time: number) => {
        if (!gameStarted || gameOver || isSuccess) return

        const spawnRate = currentLevel === 1 
            ? Math.max(450, 1500 - score * 50)
            : Math.max(800, 2000 - score * 60)

        if (time - lastSpawnRef.current > spawnRate) {
            spawnPacket()
            lastSpawnRef.current = time
        }

        setPackets(prev => {
            const next = prev.map(p => ({ ...p, y: p.y + p.speed }))
            
            const breached = next.find(p => p.y >= 100)
            if (breached) {
                setHealth(h => Math.max(0, h - HEALTH_DECREMENT))
                // Clear input if breached packet was being typed
                if (breached.word) setCurrentInput('')
                return next.filter(p => p.id !== breached.id)
            }
            return next
        })

        requestRef.current = requestAnimationFrame(gameLoop)
    }, [gameStarted, gameOver, isSuccess, score, spawnPacket, currentLevel])

    useEffect(() => {
        if (gameStarted && !gameOver && !isSuccess) {
            requestRef.current = requestAnimationFrame(gameLoop)
        }
        return () => cancelAnimationFrame(requestRef.current)
    }, [gameStarted, gameOver, isSuccess, gameLoop])

    // Level 2 Typing Listener
    useEffect(() => {
        if (currentLevel !== 2 || !gameStarted || gameOver || isSuccess) return

        const handleTyping = (e: KeyboardEvent) => {
            const key = e.key.toUpperCase()
            if (key === 'BACKSPACE') {
                setCurrentInput(prev => prev.slice(0, -1))
                return
            }
            if (key.length !== 1 || !/[A-Z]/.test(key)) return

            setCurrentInput(prev => {
                const nextInput = prev + key
                // Check if this input matches any packet's word
                const match = packets.find(p => p.word === nextInput)
                if (match) {
                    destroyPacket(match.id)
                    return ''
                }
                
                // If no matching prefix exists for any word, reset or just keep track
                const hasPossibleMatch = packets.some(p => p.word?.startsWith(nextInput))
                if (!hasPossibleMatch) {
                    // Start fresh with this key if it matches any word's start
                    const startsWithKey = packets.some(p => p.word?.startsWith(key))
                    return startsWithKey ? key : ''
                }
                
                return nextInput
            })
        }

        window.addEventListener('keydown', handleTyping)
        return () => window.removeEventListener('keydown', handleTyping)
    }, [currentLevel, gameStarted, gameOver, isSuccess, packets])

    useEffect(() => {
        if (health <= 0) {
            setGameOver(true)
            toast.error("Firewall Critical Failure. System Compromised.")
        }
    }, [health])

    useEffect(() => {
        const target = currentLevel === 1 ? TARGET_SCORE_L1 : TARGET_SCORE_L2
        if (score >= target) {
            if (currentLevel === 1) {
                toast.success("Level 1 Clear! Initializing Typing Firewall...")
                setTimeout(() => {
                    setCurrentLevel(2)
                    setScore(0)
                    setPackets([])
                    setHealth(100)
                    setCurrentInput('')
                }, 1500)
            } else if (!isSuccess) {
                handleComplete()
            }
        }
    }, [score, currentLevel, isSuccess])

    const handleComplete = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/round9/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId, score: score + 20 }) // Total score context
            })

            const data = await res.json()
            if (data.success) {
                setIsSuccess(true)
                toast.success("All Data Segments Secured. Legend Status Unlocked.")
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

    const destroyPacket = (id: string) => {
        if (gameOver || isSuccess) return
        setPackets(prev => prev.filter(p => p.id !== id))
        setScore(s => s + 1)
    }

    const resetGame = () => {
        setScore(0)
        setHealth(100)
        setGameOver(false)
        setPackets([])
        setCurrentLevel(1)
        setGameStarted(true)
        setCurrentInput('')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 select-none">
            {/* HUD */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 glass-card border-pink-500/20 bg-pink-500/5 rounded-2xl relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-pink-500/20 rounded-xl">
                        {currentLevel === 1 ? <Target className="text-pink-400" size={24} /> : <Keyboard className="text-pink-400" size={24} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight italic">Data Defender</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-pink-400/60 text-[10px] font-mono uppercase tracking-widest">
                                Level {currentLevel}: {currentLevel === 1 ? 'Packet Intercept' : 'Typing Defense'}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-8 relative z-10">
                    <div className="text-center">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Score</span>
                        <span className="text-2xl font-black font-mono text-pink-400 italic tracking-tighter">
                            {score}/{currentLevel === 1 ? TARGET_SCORE_L1 : TARGET_SCORE_L2}
                        </span>
                    </div>
                    <div className="text-center min-w-[120px]">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Firewall</span>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                            <motion.div 
                                className={`h-full ${health > 40 ? 'bg-pink-500' : 'bg-red-500'}`}
                                animate={{ width: `${health}%` }}
                                transition={{ type: 'spring', stiffness: 100 }}
                            />
                        </div>
                    </div>
                </div>

                {currentLevel === 2 && currentInput && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-pink-500/20 border border-pink-500/30 rounded-lg"
                    >
                        <span className="text-pink-400 font-mono text-xs font-bold tracking-[0.3em] font-black">{currentInput}</span>
                    </motion.div>
                )}
            </div>

            {/* Battleground */}
            <div className="relative h-[600px] glass-card rounded-[2.5rem] border-white/5 bg-black/60 overflow-hidden group cursor-crosshair">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.05)_0%,transparent_70%)]" />

                {!gameStarted && !isSuccess && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGameStarted(true)}
                        className="relative z-20 px-12 py-6 bg-pink-500 text-black font-black uppercase tracking-widest text-lg rounded-2xl shadow-glow-pink flex items-center gap-3 italic"
                    >
                        Begin Defense <ArrowRight size={24} />
                    </motion.button>
                )}

                {gameOver && (
                    <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center space-y-6 backdrop-blur-sm">
                        <XCircle size={64} className="text-red-500 animate-bounce" />
                        <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter text-center">Firewall Breached</h3>
                        <p className="text-muted-foreground font-mono">Packets leaked. System fallback failed.</p>
                        <button
                            onClick={resetGame}
                            className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-pink-400 transition-colors shadow-glow-white"
                        >
                            Re-initialize Protocol
                        </button>
                    </div>
                )}

                {/* Packets */}
                <div className="absolute inset-0">
                    <AnimatePresence>
                        {packets.map((packet) => (
                            <motion.div
                                key={packet.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                onMouseDown={() => currentLevel === 1 && destroyPacket(packet.id)}
                                className={`absolute transform -translate-x-1/2 ${currentLevel === 1 ? 'cursor-crosshair' : 'cursor-default'}`}
                                style={{ 
                                    left: `${packet.x}%`, 
                                    top: `${packet.y}%`,
                                    width: packet.size,
                                    height: currentLevel === 2 ? 40 : packet.size
                                }}
                            >
                                <div className={`
                                    w-full h-full rounded-2xl border-2 flex items-center justify-center relative transition-colors duration-300
                                    ${packet.type === 'fast' ? 'border-yellow-400 bg-yellow-400/10 shadow-glow-yellow' : 
                                      packet.type === 'tank' ? 'border-purple-500 bg-purple-500/10 shadow-glow-purple' : 
                                      'border-pink-500 bg-pink-500/10 shadow-glow-pink'}
                                    ${currentLevel === 2 ? (packet.word?.startsWith(currentInput) ? 'border-white scale-110 z-20' : 'opacity-80') : 'group-hover/packet:scale-110'}
                                `}>
                                    {currentLevel === 1 ? (
                                        <div className={`w-3 h-3 rounded-full animate-pulse ${packet.type === 'fast' ? 'bg-yellow-400' : packet.type === 'tank' ? 'bg-purple-500' : 'bg-pink-500'}`} />
                                    ) : (
                                        <div className="flex font-mono font-black text-xs tracking-widest text-white/90">
                                            {packet.word?.split('').map((char, i) => (
                                                <span key={i} className={currentInput.length > i && currentInput[i] === char && packet.word?.startsWith(currentInput) ? 'text-pink-400' : ''}>
                                                    {char}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20 whitespace-nowrap uppercase tracking-tighter">
                                        {packet.id}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Firewall Line */}
                <div className="absolute bottom-0 inset-x-0 h-2 bg-pink-500/20">
                    <motion.div 
                        className="h-full bg-pink-500 shadow-glow-pink"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            </div>

            {/* Instruction Footer */}
            <div className="flex items-center justify-between gap-6 p-6 glass-card rounded-2xl border border-white/5 bg-black/40">
                <div className="flex items-center gap-3 text-pink-400/60 flex-1">
                    {currentLevel === 1 ? <MousePointer2 size={16} /> : <Keyboard size={16} />}
                    <span className="text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                        {currentLevel === 1 
                            ? 'Click falling packets to destroy them before they reach the bottom' 
                            : 'Type the falling tech words precisely to intercept encrypted data streams'}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase hidden sm:block">Status</span>
                    <span className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-black font-mono italic text-pink-400">
                        {gameStarted ? (currentLevel === 1 ? 'INTERCEPT_V1' : 'DECRYPT_V2') : 'STANDBY'}
                    </span>
                </div>
            </div>
        </div>
    )
}

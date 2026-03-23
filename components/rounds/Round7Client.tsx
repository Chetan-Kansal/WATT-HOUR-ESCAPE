'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Zap, Shield, Target, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface LogEntry {
    id: string
    text: string
    isVulnerability: boolean
}

export default function Round7Client() {
    const router = useRouter()
    const WAVES = [
        { name: "ENTRY_BUFFER", target: 3, interval: 400, description: "Initial data bleed detected." },
        { name: "RECURSIVE_STREAM", target: 5, interval: 300, description: "Stream frequency increasing. Security protocols engaged." },
        { name: "KERNEL_COLLAPSE", target: 7, interval: 200, description: "Critical system failure. Capture all leaks now!" },
        { name: "OVERLOAD_PROTOCOL", target: 10, interval: 150, description: "Hyper-frequency data burst. Capture all remaining exploits!" }
    ]

    const [currentWave, setCurrentWave] = useState(0)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [score, setScore] = useState(0)
    const [isSuccess, setIsSuccess] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)
    const [waveTransitioning, setWaveTransitioning] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<NodeJS.Timeout>()

    const WAVE_TARGET = WAVES[currentWave].target
    const LOG_POOL = [
        "AUTH_SUCCESS: system_root",
        "INFO: DHCP request received",
        "WARN: Unrecognized handshake",
        "TRACE: Buffer overflow check ignored",
        "DEBUG: Kernel thread spawned",
        "INFO: Grid frequency stable",
        "SYSLOG: Cron job executed",
        "NET: Incoming packet dropped",
        "ERROR: Heat sink deviation",
        "INFO: Capacitor pre-charge",
        "DEBUG: Signal jitter detected"
    ]
    const VULN_PATTERN = ">> EXPLOIT_FOUND: X-99-ROOT <<"

    useEffect(() => {
        if (!gameStarted || isSuccess || waveTransitioning) return

        const addLog = () => {
            const isVuln = Math.random() > 0.85
            const newLog: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                text: isVuln ? VULN_PATTERN : LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)],
                isVulnerability: isVuln
            }

            setLogs(prev => [...prev.slice(-20), newLog])
        }

        timerRef.current = setInterval(addLog, WAVES[currentWave].interval)
        return () => clearInterval(timerRef.current)
    }, [gameStarted, isSuccess, currentWave, waveTransitioning])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    const handleCapture = async (log: LogEntry) => {
        if (!log.isVulnerability || isSuccess || waveTransitioning) return

        const newScore = score + 1
        setScore(newScore)

        // Remove the captured log visually
        setLogs(prev => prev.filter(l => l.id !== log.id))
        toast.info("Vulnerability Captured!")

        if (newScore >= WAVE_TARGET) {
            if (currentWave < WAVES.length - 1) {
                setWaveTransitioning(true)
                toast.success(`Wave ${currentWave + 1} Cleared. Shifting frequency...`)
                setTimeout(() => {
                    setCurrentWave(prev => prev + 1)
                    setScore(0)
                    setLogs([])
                    setWaveTransitioning(false)
                }, 1500)
            } else {
                submitFinal(newScore)
            }
        }
    }

    const submitFinal = async (finalScore: number) => {
        setSubmitting(true)
        try {
            const res = await fetch('/api/round7/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passed: true, score: finalScore })
            })
            const data = await res.json()
            if (res.ok && data.passed) {
                setIsSuccess(true)
                setGameStarted(false)
                toast.success("Terminal Secured. Mission Complete.")
                setTimeout(() => {
                    router.push('/dashboard')
                    router.refresh()
                }, 2000)
            } else {
                toast.error(data.error || "Submission failed.")
            }
        } catch {
            toast.error("Internal link lost.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 select-none">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-8 border border-red-500/30 bg-red-950/20 backdrop-blur-2xl relative overflow-hidden text-center"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-red-500">
                    <Shield size={160} />
                </div>
                
                <h2 className="text-4xl font-black text-white mb-4 flex items-center justify-center gap-4 font-mono tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                    <Zap size={32} className="text-red-500 animate-pulse" /> Terminal_Infiltration
                </h2>
                
                <p className="max-w-lg mx-auto text-red-200/60 text-sm uppercase font-mono tracking-widest leading-relaxed italic mb-4">
                    {WAVES[currentWave].description} Capture <span className="text-white font-black">{WAVE_TARGET}</span> vulnerability patterns.
                </p>

                <div className="flex justify-center gap-1 mb-6">
                    {WAVES.map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-12 h-1.5 rounded-full transition-all duration-700 ${i <= currentWave ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-white/10'}`} 
                        />
                    ))}
                </div>

                <div className="mt-4 flex justify-center gap-8">
                    <div className="text-center">
                        <span className="text-[10px] font-mono text-red-400 uppercase block mb-1">Patterns Captured</span>
                        <div className="text-3xl font-black font-mono text-white italic tracking-tighter">
                            {score} / {WAVE_TARGET}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Terminal View */}
            <div className="relative glass-card rounded-2xl border border-red-500/20 bg-black shadow-inner overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-red-500/20 bg-red-500/5">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500/40" />
                        <div className="w-2 h-2 rounded-full bg-red-500/40" />
                        <div className="w-2 h-2 rounded-full bg-red-500/40" />
                    </div>
                    <span className="text-[10px] font-mono text-red-500/60 uppercase tracking-widest italic">Live_Audit_Buffer</span>
                </div>

                {!gameStarted && !isSuccess ? (
                    <div className="h-[400px] flex flex-col items-center justify-center space-y-6">
                        <Terminal size={64} className="text-red-500/20 animate-pulse" />
                        <button 
                            onClick={() => setGameStarted(true)}
                            className="px-10 py-4 bg-red-500 text-black font-black uppercase tracking-widest hover:bg-red-400 transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] italic"
                        >
                            Initialize Breach
                        </button>
                    </div>
                ) : (
                    <div 
                        ref={scrollRef}
                        className="h-[400px] overflow-y-auto p-6 font-mono text-sm space-y-2 relative"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        <AnimatePresence>
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={() => handleCapture(log)}
                                    className={`
                                        p-2 rounded cursor-pointer transition-all
                                        text-red-200/40 hover:text-red-200/60
                                    `}
                                >
                                    <span className="mr-4 text-[10px] opacity-30">[{new Date().toLocaleTimeString()}]</span>
                                    {log.text}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {isSuccess && (
                            <div className="absolute inset-0 bg-red-500/10 backdrop-blur-sm flex items-center justify-center z-50">
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center p-8 glass-card border-red-500/50"
                                >
                                    <CheckCircle2 size={48} className="text-red-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Breach Successful</h3>
                                    <p className="text-red-400 font-mono text-[10px] mt-2 tracking-widest uppercase animate-pulse">Routing to extraction point...</p>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Instruction Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-3">
                    <Target className="text-red-500" size={20} />
                    <div className="text-[9px] font-mono text-red-200/40 uppercase tracking-widest leading-relaxed">
                        Identify patterns starting with <span className="text-red-400">EXPLOIT_FOUND</span>
                    </div>
                </div>
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <div className="text-[9px] font-mono text-red-200/40 uppercase tracking-widest leading-relaxed">
                        Capture patterns before they exit the <span className="text-red-400">buffer limit</span>
                    </div>
                </div>
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-3">
                    <Shield className="text-red-500" size={20} />
                    <div className="text-[9px] font-mono text-red-200/40 uppercase tracking-widest leading-relaxed">
                        Survive <span className="text-red-400">3 waves</span> of data corruption to breach
                    </div>
                </div>
            </div>

            {submitting && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-[100]">
                    <Loader2 size={48} className="animate-spin text-red-500 mb-4" />
                    <span className="text-xs font-mono font-black text-red-500 uppercase tracking-[0.3em] animate-pulse">Syncing_Breach_Data...</span>
                </div>
            )}
        </div>
    )
}

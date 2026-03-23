'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Lock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Round {
    number: number
    title: string
    completed: boolean
}

interface RoundTrackerProps {
    rounds: Round[]
    currentRound: number
    isEventStarted: boolean
}

export default function RoundTracker({ rounds, currentRound, isEventStarted }: RoundTrackerProps) {
    return (
        <div className="space-y-3">
            {rounds.map((round, index) => {
                const isCompleted = round.completed
                const isActive = isEventStarted && currentRound === round.number - 1 && !isCompleted
                const isLocked = !isEventStarted || (currentRound < round.number - 1 && !isCompleted)

                const colors = [
                    'border-blue-500/30 text-blue-400',       // R1
                    'border-green-500/30 text-green-400',     // R2
                    'border-amber-500/30 text-amber-400',     // R3
                    'border-fuchsia-500/30 text-fuchsia-400', // R4
                    'border-red-500/30 text-red-400',          // R5
                    'border-cyan-500/30 text-cyan-400',       // R6
                    'border-orange-500/30 text-orange-400',    // R7
                    'border-lime-500/30 text-lime-400',       // R8
                    'border-pink-500/30 text-pink-400',       // R9
                    'border-violet-500/30 text-violet-400'    // R10
                ]
                const activeColor = colors[index] || 'border-primary/40 text-primary'

                let statusIcon
                if (isCompleted) statusIcon = <CheckCircle2 size={20} className="text-green-500" />
                else if (isActive) statusIcon = (
                    <div className="relative">
                        <Circle size={20} className="text-primary" />
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
                    </div>
                )
                else statusIcon = <Lock size={18} className="text-muted-foreground/50" />

                const content = (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.3 }}
                        className={`
              flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
              ${isCompleted ? 'border-green-500/20 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : ''}
              ${isActive ? `bg-primary/5 shadow-glow-blue ${activeColor.split(' ')[0]}` : ''}
              ${isLocked ? 'border-border/50 opacity-50' : ''}
              ${!isCompleted && !isActive && !isLocked ? 'border-border hover:border-primary/30 hover:bg-muted/50' : ''}
            `}
                    >
                        <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className={`flex-shrink-0 w-8 h-8 rounded-full glass border flex items-center justify-center transition-shadow duration-500 ${isActive ? `${activeColor.split(' ')[0]} shadow-[0_0_15px_rgba(59,130,246,0.3)]` : 'border-border'}`}
                        >
                            <span className={`text-xs font-black ${isActive ? activeColor.split(' ')[1] : 'text-muted-foreground'}`}>{round.number}</span>
                        </motion.div>

                        {statusIcon}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest 
                                    ${isCompleted ? 'text-green-400' : isActive ? activeColor.split(' ')[1] : 'text-muted-foreground'}
                                `}>
                                    ROUND {round.number}
                                </span>
                                {isActive && (
                                    <motion.span 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`text-[10px] bg-primary/20 border-primary/50 border px-2 py-0.5 rounded-full animate-pulse font-mono font-black tracking-tighter ${activeColor.split(' ')[1]}`}
                                    >
                                        MISSION_ACTIVE
                                    </motion.span>
                                )}
                                {isCompleted && (
                                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-mono">
                                        SECURED
                                    </span>
                                )}
                                {isLocked && (
                                    <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter">ENCRYPTED</span>
                                )}
                            </div>
                            <p className="text-sm font-medium text-foreground/90 mt-0.5 font-sans">{round.title}</p>
                        </div>

                        {(isActive || (!isCompleted && !isLocked)) && (
                            <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                        )}
                    </motion.div>
                )

                if (isActive || (!isCompleted && !isLocked && isEventStarted)) {
                    return (
                        <Link key={round.number} href={`/round${round.number}`}>
                            {content}
                        </Link>
                    )
                }

                return <div key={round.number}>{content}</div>
            })}
        </div>
    )
}

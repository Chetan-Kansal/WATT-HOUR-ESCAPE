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

                let statusIcon
                if (isCompleted) statusIcon = <CheckCircle2 size={20} className="text-[#34A853]" />
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
              ${isCompleted ? 'border-[#34A853]/30 bg-[#34A853]/5' : ''}
              ${isActive ? 'border-primary/40 bg-primary/5 shadow-glow-blue' : ''}
              ${isLocked ? 'border-border/50 opacity-50' : ''}
              ${!isCompleted && !isActive && !isLocked ? 'border-border hover:border-primary/30 hover:bg-muted/50' : ''}
            `}
                    >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full glass border border-border flex items-center justify-center">
                            <span className="text-xs font-bold text-muted-foreground">{round.number}</span>
                        </div>

                        {statusIcon}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold uppercase tracking-widest ${isCompleted ? 'text-[#34A853]' :
                                        isActive ? 'text-primary' :
                                            'text-muted-foreground'
                                    }`}>
                                    ROUND {round.number}
                                </span>
                                {isActive && (
                                    <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full animate-pulse">
                                        ACTIVE
                                    </span>
                                )}
                                {isCompleted && (
                                    <span className="text-xs bg-[#34A853]/20 text-[#34A853] border border-[#34A853]/30 px-2 py-0.5 rounded-full">
                                        ✓ DONE
                                    </span>
                                )}
                                {isLocked && (
                                    <span className="text-xs text-muted-foreground/60">LOCKED</span>
                                )}
                            </div>
                            <p className="text-sm font-medium text-foreground/90 mt-0.5">{round.title}</p>
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

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, Loader2, Star } from 'lucide-react'

interface LeaderboardEntry {
    id: string
    team_name: string
    current_round: number
    status: string
    total_time: number | null
    rank: number
    formatted_time: string
    is_current_team: boolean
}

interface LeaderboardTableProps {
    entries: LeaderboardEntry[]
}

const RANK_STYLES = [
    { text: 'text-yellow-400', bg: 'bg-yellow-500/10 border border-yellow-500/30', icon: '🥇' },
    { text: 'text-slate-300', bg: 'bg-slate-500/10 border border-slate-500/30', icon: '🥈' },
    { text: 'text-orange-400', bg: 'bg-orange-500/10 border border-orange-500/30', icon: '🥉' },
]

export default function LeaderboardTable({ entries: initialEntries }: LeaderboardTableProps) {
    const [entries, setEntries] = useState(initialEntries)
    const [lastUpdated, setLastUpdated] = useState(new Date())

    // Auto-refresh every 10 seconds
    useEffect(() => {
        const id = setInterval(async () => {
            try {
                const res = await fetch('/api/leaderboard', { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    setEntries(data.leaderboard)
                    setLastUpdated(new Date())
                }
            } catch { }
        }, 10000)
        return () => clearInterval(id)
    }, [])

    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-400" /> Rankings
                </h2>
                <p className="text-xs text-muted-foreground">
                    Updated {lastUpdated.toLocaleTimeString()}
                </p>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Team</div>
                <div className="col-span-2 text-center">Round</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-2 text-right">Time</div>
            </div>

            {/* Rows */}
            <AnimatePresence>
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                        <Loader2 size={24} className="animate-spin" />
                        <p className="text-sm">No teams have started yet</p>
                    </div>
                ) : (
                    entries.map((entry, i) => {
                        const rankStyle = RANK_STYLES[i] // 0,1,2 for top 3
                        const isCompleted = entry.status === 'completed'

                        return (
                            <motion.div
                                key={entry.id}
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`grid grid-cols-12 px-6 py-4 items-center border-b border-border/20 last:border-0 transition-all
                  ${entry.is_current_team ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/20'}
                  ${i < 3 ? '' : ''}
                `}
                            >
                                {/* Rank */}
                                <div className="col-span-1">
                                    {i < 3 ? (
                                        <span className="text-lg">{rankStyle.icon}</span>
                                    ) : (
                                        <span className="text-sm font-mono text-muted-foreground">#{entry.rank}</span>
                                    )}
                                </div>

                                {/* Team name */}
                                <div className="col-span-5 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : entry.status === 'active' ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                                    <span className={`text-sm font-medium ${entry.is_current_team ? 'text-primary font-semibold' : 'text-foreground'}`}>
                                        {entry.team_name}
                                    </span>
                                    {entry.is_current_team && (
                                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">You</span>
                                    )}
                                </div>

                                {/* Round */}
                                <div className="col-span-2 text-center">
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full">
                                        {isCompleted
                                            ? <Star size={12} className="text-yellow-400" />
                                            : <span className="w-2 h-2 rounded-full bg-primary" />}
                                        <span className="text-xs font-mono font-bold text-foreground">
                                            {isCompleted ? '5/5' : `${entry.current_round + 1}/5`}
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="col-span-2 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full border font-medium capitalize
                    ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                            entry.status === 'active' ? 'bg-primary/10 text-primary border-primary/30' :
                                                'bg-muted/50 text-muted-foreground border-border'}`}>
                                        {isCompleted ? '✓ Done' : entry.status}
                                    </span>
                                </div>

                                {/* Time */}
                                <div className="col-span-2 text-right">
                                    <span className={`text-sm font-mono font-semibold flex items-center justify-end gap-1
                    ${isCompleted ? (i < 3 ? rankStyle.text : 'text-foreground') : 'text-muted-foreground'}`}>
                                        {isCompleted && <Clock size={12} />}
                                        {entry.formatted_time}
                                    </span>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </AnimatePresence>
        </div>
    )
}

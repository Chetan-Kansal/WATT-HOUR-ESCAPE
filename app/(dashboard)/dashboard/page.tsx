import { redirect } from 'next/navigation'
import { getAuthenticatedTeam, getTeamProgress } from '@/lib/auth/helpers'
import { getElapsedSeconds } from '@/lib/timer'
import ServerTimer from '@/components/dashboard/ServerTimer'
import RoundTracker from '@/components/dashboard/RoundTracker'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StartEventButton from '@/components/dashboard/StartEventButton'
import DashboardAnimateWrapper from '@/components/dashboard/DashboardAnimateWrapper'
import DashboardStagger, { DashboardStaggerItem } from '@/components/dashboard/DashboardStagger'
import { Trophy, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')

    const progress = await getTeamProgress(team.id)
    const elapsed = team.start_time ? getElapsedSeconds(team.start_time) : 0

    const rounds = [
        { number: 1, title: 'Console Log Quiz', completed: progress?.round1_completed ?? false },
        { number: 2, title: 'Debugging Challenge', completed: progress?.round2_completed ?? false },
        { number: 3, title: 'Phase Lock', completed: progress?.round3_completed ?? false },
        { number: 4, title: 'Power Runner', completed: progress?.round4_completed ?? false },
        { number: 5, title: 'Morse Code Final', completed: progress?.round5_completed ?? false },
        { number: 6, title: 'Logic Leak', completed: progress?.round6_completed ?? false },
        { number: 7, title: 'Terminal Infiltration', completed: progress?.round7_completed ?? false },
        { number: 8, title: 'Frequency Sync', completed: progress?.round8_completed ?? false },
        { number: 9, title: 'Data Defender', completed: progress?.round9_completed ?? false },
        { number: 10, title: "Smart-Grid Stabilizer", completed: progress?.round10_completed ?? false },
    ]

    const completedRoundsCount = rounds.filter(r => r.completed).length
    const currentRound = Math.min(completedRoundsCount, 9) // 0-indexed, max index is 9 (Round 10)
    const isEventStarted = !!team.start_time
    const isCompleted = team.status === 'completed'
    const nextRound = isCompleted ? null : Math.min(completedRoundsCount + 1, 10)

    return (
        <DashboardAnimateWrapper>
            <DashboardHeader teamName={team.team_name} role={team.role} />

            <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
                <DashboardStagger>
                    {/* Admin Link */}
                    {team.role === 'admin' && (
                        <DashboardStaggerItem className="space-y-4">
                            <Link
                                href="/admin/testing"
                                className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all group backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <Zap size={20} className="text-red-500" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground font-mono uppercase tracking-tighter">Admin Testing Suite</p>
                                        <p className="text-xs text-muted-foreground">Jump to rounds, reset data, and force completions.</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-red-500 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            {!isEventStarted && (
                                <StartEventButton />
                            )}
                        </DashboardStaggerItem>
                    )}

                    {/* Stats Row */}
                    <DashboardStaggerItem className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="glass rounded-xl p-4 text-center border border-white/10 shadow-lg backdrop-blur-md group hover:border-primary/40 transition-colors">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-mono">Current Round</p>
                            <p className="text-3xl font-black text-primary italic tracking-tighter transition-transform group-hover:scale-110 duration-300">
                                {isEventStarted ? (currentRound + 1).toString().padStart(2, '0') : '——'}
                            </p>
                        </div>
                        <div className="glass rounded-xl p-4 text-center border border-white/10 shadow-lg backdrop-blur-md group hover:border-[#34A853]/40 transition-colors">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-mono">Completed</p>
                            <p className="text-3xl font-black text-[#34A853] italic tracking-tighter transition-transform group-hover:scale-110 duration-300">
                                {rounds.filter(r => r.completed).length}/10
                            </p>
                        </div>
                        <div className="col-span-2 glass rounded-xl p-4 flex flex-col items-center justify-center border border-white/10 shadow-lg backdrop-blur-md group hover:border-primary/40 transition-colors">
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-mono">Elapsed Time</p>
                            {isEventStarted ? (
                                <ServerTimer
                                    initialElapsed={elapsed}
                                    isStopped={isCompleted}
                                    totalTime={team.total_time}
                                />
                            ) : (
                                <p className="text-2xl font-mono font-bold text-muted-foreground tracking-widest opacity-50">——:——:——</p>
                            )}
                        </div>
                    </DashboardStaggerItem>

                    {/* Mission Progress */}
                    <DashboardStaggerItem className="glass-card rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-8 flex items-center gap-3 italic">
                            <Zap size={16} className="text-primary animate-pulse" /> Mission_Status_v2.0
                        </h2>
                        <RoundTracker
                            rounds={rounds}
                            currentRound={currentRound}
                            isEventStarted={isEventStarted}
                        />
                    </DashboardStaggerItem>

                    {/* CTA */}
                    <DashboardStaggerItem className="flex flex-col sm:flex-row gap-4">
                        {!isEventStarted ? (
                            <StartEventButton />
                        ) : isCompleted ? (
                            <div className="flex-1 glass-card rounded-2xl p-6 text-center border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-md">
                                <Trophy className="mx-auto mb-3 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" size={40} />
                                <h3 className="text-xl font-black text-foreground mb-1 uppercase tracking-tight italic">Mission Accomplished</h3>
                                <p className="text-muted-foreground text-sm mb-6">
                                    Total mission duration: <span className="text-primary font-mono font-black tracking-widest">
                                        {team.total_time ? `${Math.floor(team.total_time / 60)}M ${team.total_time % 60}S` : '——'}
                                    </span>
                                </p>
                            </div>
                        ) : nextRound && (currentRound >= nextRound - 1) ? (
                            <Link
                                href={`/round${nextRound}`}
                                className="flex-1 py-5 px-8 bg-primary text-primary-foreground rounded-xl font-black tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] text-center text-lg italic border border-white/20"
                            >
                                Continue Operation <ArrowRight size={20} className="animate-bounce-x" />
                            </Link>
                        ) : null}

                    </DashboardStaggerItem>
                </DashboardStagger>
            </main>
        </DashboardAnimateWrapper>
    )
}

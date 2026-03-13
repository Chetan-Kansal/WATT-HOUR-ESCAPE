import { redirect } from 'next/navigation'
import { getAuthenticatedTeam, getTeamProgress } from '@/lib/auth/helpers'
import { getElapsedSeconds } from '@/lib/timer'
import ServerTimer from '@/components/dashboard/ServerTimer'
import RoundTracker from '@/components/dashboard/RoundTracker'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StartEventButton from '@/components/dashboard/StartEventButton'
import { Trophy, Zap } from 'lucide-react'
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
        { number: 3, title: 'Circuit Design', completed: progress?.round3_completed ?? false },
        { number: 4, title: 'Reverse AI Prompt', completed: progress?.round4_completed ?? false },
        { number: 5, title: 'Morse Code Final', completed: progress?.round5_completed ?? false },
    ]

    const currentRound = team.current_round
    const isEventStarted = !!team.start_time
    const isCompleted = team.status === 'completed'
    const nextRound = isCompleted ? null : Math.min(currentRound + 1, 5)

    return (
        <div className="min-h-screen ambient-bg">
            <DashboardHeader teamName={team.team_name} />

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Round</p>
                        <p className="text-3xl font-bold text-primary">{isEventStarted ? currentRound + 1 : '—'}</p>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
                        <p className="text-3xl font-bold text-[#34A853]">{rounds.filter(r => r.completed).length}/5</p>
                    </div>
                    <div className="col-span-2 glass rounded-xl p-4 flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Elapsed Time</p>
                        {isEventStarted ? (
                            <ServerTimer
                                initialElapsed={elapsed}
                                isStopped={isCompleted}
                                totalTime={team.total_time}
                            />
                        ) : (
                            <p className="text-2xl font-mono font-bold text-muted-foreground">—:——:——</p>
                        )}
                    </div>
                </div>

                {/* Mission Progress */}
                <div className="glass-card rounded-2xl p-6 md:p-8">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Zap size={14} className="text-primary" /> Mission Progress
                    </h2>
                    <RoundTracker
                        rounds={rounds}
                        currentRound={currentRound}
                        isEventStarted={isEventStarted}
                    />
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {!isEventStarted ? (
                        <StartEventButton />
                    ) : isCompleted ? (
                        <div className="flex-1 glass-card rounded-2xl p-6 text-center">
                            <Trophy className="mx-auto mb-3 text-yellow-400" size={40} />
                            <h3 className="text-xl font-bold text-foreground mb-1">Event Completed!</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Total time: <span className="text-primary font-mono font-semibold">
                                    {team.total_time ? `${Math.floor(team.total_time / 60)}m ${team.total_time % 60}s` : '—'}
                                </span>
                            </p>
                            <Link
                                href="/leaderboard"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-all font-semibold"
                            >
                                <Trophy size={16} /> View Leaderboard
                            </Link>
                        </div>
                    ) : nextRound && (currentRound >= nextRound - 1) ? (
                        <Link
                            href={`/round${nextRound}`}
                            className="flex-1 py-4 px-8 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 shadow-glow-blue text-center text-lg"
                        >
                            Continue → Round {nextRound}: {rounds[nextRound - 1]?.title}
                        </Link>
                    ) : null}

                    <Link
                        href="/leaderboard"
                        className="px-6 py-4 glass border border-border rounded-xl font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all flex items-center gap-2"
                    >
                        <Trophy size={16} /> Leaderboard
                    </Link>
                </div>
            </main>
        </div>
    )
}

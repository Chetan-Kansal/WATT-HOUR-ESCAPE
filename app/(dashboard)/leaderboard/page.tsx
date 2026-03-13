import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import { formatTime } from '@/lib/timer'

export const dynamic = 'force-dynamic'
export const revalidate = 10

export default async function LeaderboardPage() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')

    const admin = createSupabaseAdmin()
    const { data: entries } = await admin
        .from('leaderboard' as never)
        .select('id, team_name, current_round, status, total_time, rank')
        .limit(50)

    const leaderboard = ((entries as Array<{
        id: string
        team_name: string
        current_round: number
        status: string
        total_time: number | null
        rank: number
    }>) ?? []).map(e => ({
        ...e,
        formatted_time: e.total_time ? formatTime(e.total_time) : '—',
        is_current_team: e.id === team.id,
    }))

    return (
        <div className="min-h-screen ambient-bg py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="flex gap-1">
                            {['#4285F4', '#EA4335', '#FBBC05', '#34A853'].map(c => (
                                <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                            ))}
                        </div>
                        <span className="text-muted-foreground">×</span>
                        <span className="text-xs font-bold text-[#006699]">IEEE PES</span>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text-blue">Live Leaderboard</h1>
                    <p className="text-muted-foreground text-sm">Updates every 10 seconds · Ranked by completion time</p>
                </div>

                {/* Current team highlight */}
                {leaderboard.find(e => e.is_current_team) && (() => {
                    const me = leaderboard.find(e => e.is_current_team)!
                    return (
                        <div className="glass-card rounded-2xl p-5 border border-primary/30 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Team</p>
                            <p className="text-lg font-bold text-foreground">{me.team_name}</p>
                            <div className="flex items-center justify-center gap-6 mt-2">
                                <span className="text-sm text-muted-foreground">Rank: <strong className="text-primary">#{me.rank}</strong></span>
                                <span className="text-sm text-muted-foreground">Round: <strong className="text-foreground">{me.current_round + 1}/5</strong></span>
                                <span className="text-sm text-muted-foreground">Time: <strong className="font-mono text-foreground">{me.formatted_time}</strong></span>
                            </div>
                        </div>
                    )
                })()}

                <LeaderboardTable entries={leaderboard} />
            </div>
        </div>
    )
}

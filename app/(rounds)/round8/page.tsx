import { redirect } from 'next/navigation'
import { getAuthenticatedTeam, getTeamProgress } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round8Client from '@/components/rounds/Round8Client'
import { canAccessRound } from '@/lib/roundLogic'

export const dynamic = 'force-dynamic'

export default async function Round8Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')

    const allowed = await canAccessRound(team.id, 8)
    if (!allowed && team.role !== 'admin') redirect('/dashboard')

    const progress = await getTeamProgress(team.id)

    return (
        <RoundLayout
            roundNumber={8}
            title="Signal Scramble"
            startTime={team.start_time}
            isCompleted={progress?.round8_completed}
            role={team.role}
            theme="lime-scramble"
        >
            <Round8Client 
                teamId={team.id}
                isCompleted={!!progress?.round8_completed}
            />
        </RoundLayout>
    )
}

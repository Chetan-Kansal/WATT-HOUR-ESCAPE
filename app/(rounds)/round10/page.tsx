import { redirect } from 'next/navigation'
import { getAuthenticatedTeam, getTeamProgress } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round10Client from '@/components/rounds/Round10Client'
import { canAccessRound } from '@/lib/roundLogic'

export const dynamic = 'force-dynamic'

export default async function Round10Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')

    const allowed = await canAccessRound(team.id, 10)
    if (!allowed && team.role !== 'admin') redirect('/dashboard')

    const progress = await getTeamProgress(team.id)

    return (
        <RoundLayout
            roundNumber={10}
            title="The Quantum Key"
            startTime={team.start_time}
            isCompleted={progress?.round10_completed}
            role={team.role}
            theme="violet-quantum"
        >
            <Round10Client 
                teamId={team.id}
                isCompleted={!!progress?.round10_completed}
            />
        </RoundLayout>
    )
}

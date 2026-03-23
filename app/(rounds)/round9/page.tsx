import { redirect } from 'next/navigation'
import { getAuthenticatedTeam, getTeamProgress } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round9Client from '@/components/rounds/Round9Client'
import { canAccessRound } from '@/lib/roundLogic'

export const dynamic = 'force-dynamic'

export default async function Round9Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')

    const allowed = await canAccessRound(team.id, 9)
    if (!allowed && team.role !== 'admin') redirect('/dashboard')

    const progress = await getTeamProgress(team.id)

    return (
        <RoundLayout
            roundNumber={9}
            title="Byte Barrage"
            startTime={team.start_time}
            isCompleted={progress?.round9_completed}
            role={team.role}
            theme="pink-barrage"
        >
            <Round9Client 
                teamId={team.id}
                isCompleted={!!progress?.round9_completed}
            />
        </RoundLayout>
    )
}

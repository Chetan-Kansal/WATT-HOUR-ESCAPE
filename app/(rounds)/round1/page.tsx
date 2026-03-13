import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round1Client from '@/components/rounds/Round1Client'

export default async function Round1Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')
    if (!team.start_time) redirect('/dashboard')

    return (
        <RoundLayout
            roundNumber={1}
            title="Console Log Quiz"
            startTime={team.start_time}
            isCompleted={team.status === 'completed'}
            totalTime={team.total_time}
        >
            <Round1Client />
        </RoundLayout>
    )
}

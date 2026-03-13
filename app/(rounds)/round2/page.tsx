import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round2Client from '@/components/rounds/Round2Client'

export default async function Round2Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')
    if (!team.start_time) redirect('/dashboard')

    return (
        <RoundLayout
            roundNumber={2}
            title="Debugging Challenge"
            startTime={team.start_time}
            isCompleted={team.status === 'completed'}
            totalTime={team.total_time}
        >
            <Round2Client />
        </RoundLayout>
    )
}

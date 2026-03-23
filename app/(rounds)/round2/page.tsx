import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round2Client from '@/components/rounds/Round2Client'

export default async function Round2Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')
    if (!team.start_time && team.role !== 'admin') redirect('/dashboard')

    return (
        <RoundLayout
            roundNumber={2}
            title="Debugging Challenge"
            startTime={team.start_time}
            isCompleted={team.status === 'completed'}
            totalTime={team.total_time}
            role={team.role}
            theme="matrix-root"
        >
            <Round2Client />
        </RoundLayout>
    )
}

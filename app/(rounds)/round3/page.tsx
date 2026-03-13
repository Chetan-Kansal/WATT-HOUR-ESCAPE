import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round3Client from '@/components/rounds/Round3Client'

export default async function Round3Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')
    if (!team.start_time) redirect('/dashboard')
    return (
        <RoundLayout roundNumber={3} title="Circuit Design" startTime={team.start_time} isCompleted={team.status === 'completed'} totalTime={team.total_time}>
            <Round3Client />
        </RoundLayout>
    )
}

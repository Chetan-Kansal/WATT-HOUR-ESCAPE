import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round4Client from '@/components/rounds/Round4Client'

export default async function Round4Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')
    if (!team.start_time) redirect('/dashboard')
    return (
        <RoundLayout roundNumber={4} title="Reverse AI Prompt" startTime={team.start_time} isCompleted={team.status === 'completed'} totalTime={team.total_time}>
            <Round4Client />
        </RoundLayout>
    )
}

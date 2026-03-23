import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round5Client from '@/components/rounds/Round5Client'

export default async function Round5Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')
    if (!team.start_time && team.role !== 'admin') redirect('/dashboard')
    return (
        <RoundLayout roundNumber={5} title="Morse Code Final" startTime={team.start_time} isCompleted={team.status === 'completed'} totalTime={team.total_time} role={team.role} theme="matrix-breach">
            <Round5Client />
        </RoundLayout>
    )
}

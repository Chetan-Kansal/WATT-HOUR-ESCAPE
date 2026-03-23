import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round7Client from '@/components/rounds/Round7Client'

export const dynamic = 'force-dynamic'

export default async function Round7Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')
    if (!team.start_time && team.role !== 'admin') redirect('/dashboard')
    
    return (
        <RoundLayout 
            roundNumber={7} 
            title="Terminal Infiltration" 
            startTime={team.start_time} 
            isCompleted={team.status === 'completed'} 
            totalTime={team.total_time} 
            role={team.role} 
            theme="crimson-breach"
        >
            <Round7Client />
        </RoundLayout>
    )
}

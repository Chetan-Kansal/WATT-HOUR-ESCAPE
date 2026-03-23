import { redirect } from 'next/navigation'
import { getAuthenticatedTeam } from '@/lib/auth/helpers'
import RoundLayout from '@/components/rounds/RoundLayout'
import Round6Client from '@/components/rounds/Round6Client'

export const dynamic = 'force-dynamic'

export default async function Round6Page() {
    const team = await getAuthenticatedTeam()
    if (!team) redirect('/login')
    if (!team.start_time && team.role !== 'admin') redirect('/dashboard')
    
    return (
        <RoundLayout 
            roundNumber={6} 
            title="Logic Leak" 
            startTime={team.start_time} 
            isCompleted={team.status === 'completed'} 
            totalTime={team.total_time} 
            role={team.role} 
            theme="cyan-matrix"
        >
            <Round6Client />
        </RoundLayout>
    )
}

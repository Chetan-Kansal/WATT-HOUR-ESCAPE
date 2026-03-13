import { createSupabaseAdmin } from '@/lib/supabase/server'

// ── Format elapsed seconds as MM:SS:HH ───────────────────────────────────────
export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ── Get current server time ───────────────────────────────────────────────────
export async function getServerTime(): Promise<Date> {
    const admin = createSupabaseAdmin()
    const { data } = await admin.rpc('get_server_time' as never)
    if (data) return new Date(data as string)
    return new Date()
}

// ── Compute elapsed seconds since start_time ──────────────────────────────────
export function getElapsedSeconds(startTime: string | null): number {
    if (!startTime) return 0
    const start = new Date(startTime).getTime()
    const now = Date.now()
    return Math.floor((now - start) / 1000)
}

// ── Finalize event: set end_time + compute total_time ────────────────────────
export async function finalizeTeamTimer(teamId: string, startTime: string): Promise<number> {
    const admin = createSupabaseAdmin()
    const endTime = new Date()
    const totalTime = Math.floor((endTime.getTime() - new Date(startTime).getTime()) / 1000)

    await admin
        .from('teams')
        .update({
            end_time: endTime.toISOString(),
            total_time: totalTime,
            status: 'completed',
        })
        .eq('id', teamId)

    return totalTime
}

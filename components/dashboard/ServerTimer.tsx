'use client'

import { useEffect, useState, useRef } from 'react'
import { Timer } from 'lucide-react'
import { formatTime } from '@/lib/timer'

interface ServerTimerProps {
    initialElapsed: number
    isStopped: boolean
    totalTime?: number | null
}

export default function ServerTimer({ initialElapsed, isStopped, totalTime }: ServerTimerProps) {
    const [elapsed, setElapsed] = useState(isStopped && totalTime ? totalTime : initialElapsed)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isStopped) return

        // Tick every second
        intervalRef.current = setInterval(() => {
            setElapsed(e => e + 1)
        }, 1000)

        // Sync with server every 30 seconds to prevent drift
        syncIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch('/api/timer', { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    if (data.elapsed_seconds) {
                        setElapsed(data.elapsed_seconds)
                    }
                }
            } catch {
                // Silently fail — local counter continues
            }
        }, 30000)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
        }
    }, [isStopped])

    const formattedTime = formatTime(elapsed)

    return (
        <div className="flex items-center gap-3">
            <Timer size={18} className={isStopped ? 'text-yellow-400' : 'text-primary animate-pulse'} />
            <span className="text-2xl font-mono font-bold tracking-wider text-foreground">
                {formattedTime}
            </span>
            {isStopped && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                    FINAL
                </span>
            )}
        </div>
    )
}

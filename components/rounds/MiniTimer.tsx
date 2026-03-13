'use client'

import { useEffect, useState } from 'react'
import { getElapsedSeconds, formatTime } from '@/lib/timer'

export default function MiniTimer({
    startTime,
    isCompleted,
    totalTime,
}: {
    startTime: string
    isCompleted?: boolean
    totalTime?: number | null
}) {
    const [elapsed, setElapsed] = useState(
        isCompleted && totalTime ? totalTime : getElapsedSeconds(startTime)
    )

    useEffect(() => {
        if (isCompleted) return
        const id = setInterval(() => setElapsed(getElapsedSeconds(startTime)), 1000)
        return () => clearInterval(id)
    }, [startTime, isCompleted])

    return (
        <span className="text-sm font-mono font-bold text-foreground">{formatTime(elapsed)}</span>
    )
}

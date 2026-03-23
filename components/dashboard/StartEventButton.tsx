'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PlayCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function StartEventButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    console.log("StartEventButton: Rendering component")

    const handleStart = async () => {
        console.log("StartEventButton: handleStart triggered")
        setLoading(true)
        console.log("StartEventButton: loading set to true")
        try {
            console.log("StartEventButton: initiating fetch /api/event/start")
            const res = await fetch('/api/event/start', { method: 'POST' })
            console.log("StartEventButton: fetch completed, status:", res.status)
            const data = await res.json()
            console.log("StartEventButton: response data:", data)

            if (!res.ok) {
                toast.error(data.error || 'Failed to start event')
                return
            }

            toast.success('Event started! Timer is running. Good luck!')
            console.log("StartEventButton: refreshing router")
            router.refresh()
        } catch (error) {
            console.error("StartEventButton: handleStart error:", error)
            toast.error('Failed to start event. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 py-4 px-8 bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-glow-blue text-lg w-full"
        >
            {loading ? (
                <><Loader2 size={22} className="animate-spin" /> Starting...</>
            ) : (
                <><PlayCircle size={22} /> START EVENT</>
            )}
        </button>
    )
}

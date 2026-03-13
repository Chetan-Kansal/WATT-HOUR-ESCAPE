'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { PlayCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function StartEventButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleStart = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/event/start', { method: 'POST' })
            const data = await res.json()

            if (!res.ok) {
                toast.error(data.error || 'Failed to start event')
                return
            }

            toast.success('Event started! Timer is running. Good luck!')
            router.refresh()
        } catch {
            toast.error('Failed to start event. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={loading}
            className="flex-1 py-4 px-8 bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-glow-blue text-lg"
        >
            {loading ? (
                <><Loader2 size={22} className="animate-spin" /> Starting...</>
            ) : (
                <><PlayCircle size={22} /> START EVENT</>
            )}
        </motion.button>
    )
}

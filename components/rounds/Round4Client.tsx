'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BrainCircuit, Zap } from 'lucide-react'
import { toast } from 'sonner'
import PowerRunner from './Round4PowerRunner'

export default function Round4Client() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const MIN_SCORE = 700

    const handleComplete = async (score: number) => {
        if (submitting) return
        setSubmitting(true)
        
        try {
            const res = await fetch('/api/round4/submit', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score }) 
            })
            const data = await res.json()
            
            if (res.ok && data.passed) {
                toast.success('✓ Grid Synchronized! Round 4 complete.')
                setTimeout(() => router.push('/dashboard'), 3000)
            } else {
                toast.error(data.error || 'Failed to secure progress.')
            }
        } catch {
            toast.error('Neural uplink failed. Try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-8 border border-primary/30 bg-[#0A0A0A]/80 backdrop-blur-2xl relative overflow-hidden text-center"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <BrainCircuit size={160} />
                </div>
                
                <h2 className="text-4xl font-black text-white mb-4 flex items-center justify-center gap-4 font-mono tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-amber-200 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                    <Zap size={32} className="text-amber-500 animate-pulse" /> Power_Runner_v2.0
                </h2>
                
                <p className="max-w-lg mx-auto text-amber-500/70 text-sm uppercase font-mono tracking-widest leading-relaxed">
                    A critical surge is destabilizing the secondary grid. 
                    <span className="text-amber-500 font-extrabold ml-2">Objective:</span> Reach a synchronization level of 
                    <span className="text-white border-b border-amber-500/50 mx-2 text-xl italic font-black">700</span> 
                    to secure the neural uplink.
                </p>
            </motion.div>

            <PowerRunner minScore={MIN_SCORE} onComplete={handleComplete} />
        </div>
    )
}

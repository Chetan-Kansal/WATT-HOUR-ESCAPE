'use client'

import { motion } from 'framer-motion'
import DashboardEffects from '@/components/effects/DashboardEffects'

export default function DashboardAnimateWrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen overflow-hidden">
            <DashboardEffects />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
            >
                {children}
            </motion.div>
        </div>
    )
}

export const staggeredContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

export const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

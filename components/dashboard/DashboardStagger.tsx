'use client'

import { motion } from 'framer-motion'
import { fadeInUp, staggeredContainer } from './DashboardAnimateWrapper'

export default function DashboardStagger({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            variants={staggeredContainer}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {children}
        </motion.div>
    )
}

export function DashboardStaggerItem({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.div variants={fadeInUp} className={className}>
            {children}
        </motion.div>
    )
}

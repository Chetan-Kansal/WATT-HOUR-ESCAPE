'use client'

import { motion } from 'framer-motion'

export default function DashboardEffects() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Base Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/80" />
            
            {/* Dynamic Grid */}
            <div 
                className="absolute inset-0 opacity-[0.15]" 
                style={{ 
                    backgroundImage: `
                        linear-gradient(to right, #3b82f6 1px, transparent 1px),
                        linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
                }} 
            />

            {/* Moving Scanline */}
            <motion.div 
                initial={{ translateY: '-100%' }}
                animate={{ translateY: '1000%' }}
                transition={{ 
                    duration: 10, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            />

            {/* Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full animate-slow-pulse" />
        </div>
    )
}

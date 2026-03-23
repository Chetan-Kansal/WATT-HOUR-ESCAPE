'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Trophy, LayoutDashboard } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function DashboardHeader({ teamName, role }: { teamName: string, role?: string }) {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signOut()
        toast.success('Signed out successfully')
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="border-b border-border/50 glass sticky top-0 z-40">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] animate-pulse" />
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground hidden sm:block font-mono tracking-tighter uppercase italic">GDG</span>
                        {role === 'admin' && (
                            <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)] font-mono">
                                ADMIN_LINK
                            </span>
                        )}
                    </div>
                </div>

                {/* Team name */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border border-primary/20 rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.1)] group hover:border-primary/50 transition-all duration-500"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    <span className="text-xs font-black text-primary font-mono tracking-[0.2em] uppercase italic">{teamName}</span>
                </motion.div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLogout}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-muted"
                        title="Sign out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    )
}

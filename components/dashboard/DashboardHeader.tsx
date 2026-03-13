'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Trophy, LayoutDashboard } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function DashboardHeader({ teamName }: { teamName: string }) {
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
                    <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#4285F4]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC05]" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]" />
                    </div>
                    <span className="text-sm font-bold text-foreground hidden sm:block">GDG × IEEE PES</span>
                </div>

                {/* Team name */}
                <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                    <LayoutDashboard size={12} className="text-primary" />
                    <span className="text-sm font-semibold text-primary">{teamName}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Link
                        href="/leaderboard"
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                        title="Leaderboard"
                    >
                        <Trophy size={18} />
                    </Link>
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

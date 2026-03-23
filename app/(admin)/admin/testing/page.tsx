'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, RotateCcw, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminTestingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleAction = async (action: string, round?: number) => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/testing/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, round })
            })

            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                router.refresh()
            } else {
                toast.error(data.error || 'Failed to perform action')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const rounds = [
        { id: 1, name: 'Console Log Quiz' },
        { id: 2, name: 'Debugging Challenge' },
        { id: 3, name: 'Phase Lock' },
        { id: 4, name: 'Power Runner' },
        { id: 5, name: 'Morse Code Final' },
        { id: 6, name: 'Logic Leak' },
        { id: 7, name: 'Terminal Infiltration' },
        { id: 8, name: 'Frequency Sync' },
        { id: 9, name: 'Data Defender' },
        { id: 10, name: 'Smart-Grid Stabilizer' },
    ]

    return (
        <div className="min-h-screen ambient-bg py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <ShieldAlert size={14} /> Admin Testing Suite
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Round Testing Dashboard</h1>
                    <p className="text-muted-foreground italic text-sm">Use these tools to verify round transitions and edge cases. These actions affect YOUR progress only.</p>
                </div>

                {/* Reset Section */}
                <div className="glass-card rounded-2xl p-6 border-red-500/20">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <RotateCcw size={18} className="text-red-500" /> Reset Progress
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Clear all your round completions and reset to Round 0.</p>
                        </div>
                        <button
                            disabled={loading}
                            onClick={() => {
                                if (confirm('Are you sure? This will wipe your current round progress.')) {
                                    handleAction('reset')
                                }
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-glow-red"
                        >
                            Reset My Data
                        </button>
                    </div>
                </div>

                {/* Round Shortcuts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-6 space-y-4">
                        <h2 className="text-md font-semibold text-foreground flex items-center gap-2">
                            <Zap size={18} className="text-yellow-500" /> Quick Jump
                        </h2>
                        <div className="grid grid-cols-1 gap-2">
                            {rounds.map((r) => (
                                <Link
                                    key={r.id}
                                    href={`/round${r.id}`}
                                    className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-xl transition-all group"
                                >
                                    <span className="text-sm font-medium">Round {r.id}: {r.name}</span>
                                    <ArrowRight size={14} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 space-y-4">
                        <h2 className="text-md font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-500" /> Force Complete
                        </h2>
                        <div className="grid grid-cols-1 gap-2">
                            {rounds.map((r) => (
                                <button
                                    key={r.id}
                                    disabled={loading}
                                    onClick={() => handleAction('complete', r.id)}
                                    className="flex items-center justify-between p-3 bg-green-500/5 hover:bg-green-500/10 border border-green-500/20 rounded-xl transition-all group"
                                >
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Mark R{r.id} Done</span>
                                    <CheckCircle2 size={14} className="text-green-500/50" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Return button */}
                <div className="text-center">
                    <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        ← Back to Team Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}

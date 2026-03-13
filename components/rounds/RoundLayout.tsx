import Link from 'next/link'
import { ArrowLeft, Timer } from 'lucide-react'
import MiniTimer from '@/components/rounds/MiniTimer'

interface RoundLayoutProps {
    roundNumber: number
    title: string
    children: React.ReactNode
    startTime?: string | null
    isCompleted?: boolean
    totalTime?: number | null
}

export default function RoundLayout({
    roundNumber,
    title,
    children,
    startTime,
    isCompleted,
    totalTime,
}: RoundLayoutProps) {
    return (
        <div className="min-h-screen ambient-bg">
            {/* Round Header */}
            <header className="border-b border-border/50 glass sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={16} /> Dashboard
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-primary/15 border border-primary/30 rounded-full">
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">
                                Round {roundNumber}
                            </span>
                        </div>
                        <h1 className="text-sm font-semibold text-foreground hidden sm:block">{title}</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Timer size={14} className="text-muted-foreground" />
                        {startTime ? (
                            <MiniTimer startTime={startTime} isCompleted={isCompleted} totalTime={totalTime} />
                        ) : (
                            <span className="text-sm font-mono text-muted-foreground">--:--</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    )
}

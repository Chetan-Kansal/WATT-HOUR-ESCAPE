import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'GDG × IEEE PES | TechChallenge 2026',
    description: 'A competitive 5-round technical challenge platform for the GDG and IEEE PES collaboration event.',
    keywords: ['GDG', 'IEEE PES', 'competition', 'technical challenge', 'coding contest'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
                {children}
                <Toaster />
            </body>
        </html>
    )
}

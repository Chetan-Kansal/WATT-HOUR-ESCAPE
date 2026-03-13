import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
    title: 'Register | GDG × IEEE PES TechChallenge',
}

export default async function RegisterPage() {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/dashboard')

    return (
        <div className="min-h-screen ambient-bg grid-overlay flex items-center justify-center p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="flex gap-1">
                            <span className="w-3 h-3 rounded-full bg-[#4285F4]" />
                            <span className="w-3 h-3 rounded-full bg-[#EA4335]" />
                            <span className="w-3 h-3 rounded-full bg-[#FBBC05]" />
                            <span className="w-3 h-3 rounded-full bg-[#34A853]" />
                        </div>
                        <span className="text-muted-foreground text-sm font-medium px-2">×</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-4 bg-[#006699] rounded-sm" />
                            <span className="text-xs font-bold text-[#006699]">IEEE PES</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text-blue mb-2">Register Team</h1>
                    <p className="text-muted-foreground text-sm">Create your team to compete in TechChallenge 2026</p>
                </div>

                <div className="glass-card rounded-2xl p-8">
                    <RegisterForm />

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Already registered?{' '}
                        <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-muted-foreground/50 mt-6">
                    Powered by GDG Campus × IEEE PES Student Branch
                </p>
            </div>
        </div>
    )
}

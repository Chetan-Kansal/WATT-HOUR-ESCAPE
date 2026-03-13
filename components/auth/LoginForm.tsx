'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { LoginSchema, type LoginInput } from '@/lib/validation/schemas'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginForm() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
        resolver: zodResolver(LoginSchema),
    })

    const onSubmit = async (data: LoginInput) => {
        setLoading(true)
        try {
            const supabase = createSupabaseBrowserClient()
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })

            if (error) {
                toast.error(error.message === 'Invalid login credentials'
                    ? 'Invalid email or password'
                    : error.message)
                return
            }

            toast.success('Welcome back!')
            router.push('/dashboard')
            router.refresh()
        } catch {
            toast.error('Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Team Email</label>
                <input
                    {...register('email')}
                    type="email"
                    placeholder="team@university.edu"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Password</label>
                <div className="relative">
                    <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-glow-blue"
            >
                {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                ) : (
                    'Sign In to Compete'
                )}
            </button>
        </form>
    )
}

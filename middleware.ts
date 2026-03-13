import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return request.cookies.get(name)?.value },
                set(name: string, value: string, options: Record<string, unknown>) {
                    request.cookies.set({ name, value, ...options } as never)
                    response = NextResponse.next({ request })
                    response.cookies.set({ name, value, ...options } as never)
                },
                remove(name: string, options: Record<string, unknown>) {
                    request.cookies.set({ name, value: '', ...options } as never)
                    response = NextResponse.next({ request })
                    response.cookies.set({ name, value: '', ...options } as never)
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // ── Public routes — no auth required ───────────────────────────────────────
    const publicPaths = ['/login', '/register', '/api/auth', '/']
    const isPublic = publicPaths.some(p => pathname.startsWith(p))

    // ── Redirect unauthenticated users ─────────────────────────────────────────
    if (!user && !isPublic) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    // ── Redirect logged-in users away from auth pages ─────────────────────────
    if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // ── Round access control — enforce sequential completion ──────────────────
    if (user && pathname.match(/^\/round[2-5]/)) {
        const roundMatch = pathname.match(/^\/round(\d)/)
        const requestedRound = roundMatch ? parseInt(roundMatch[1]) : null

        if (requestedRound && requestedRound > 1) {
            // Check current_round from DB
            const { data: team } = await supabase
                .from('teams')
                .select('current_round, status, start_time')
                .eq('id', user.id)
                .single()

            if (!team || !team.start_time || team.status === 'registered') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }

            // Must have completed previous round
            if (team.current_round < requestedRound - 1) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }
    }

    // ── Admin protection ──────────────────────────────────────────────────────
    if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
        // Admin routes require a special admin email (configurable)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gdgieee.com'
        if (!user || user.email !== adminEmail) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|audio|circuits|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

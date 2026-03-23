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
    const publicPaths = ['/login', '/register', '/api/auth']
    const isPublic = publicPaths.some(p => pathname.startsWith(p))

    // ── Redirect root to dashboard ─────────────────────────────────────────────
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // ── Redirect unauthenticated users ─────────────────────────────────────────
    if (!user && !isPublic) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
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
    if (user && (pathname.match(/^\/round([1-9]|10)/) || pathname.startsWith('/admin'))) {
        // Check team data from DB (role and progression)
        const { data: team } = await supabase
            .from('teams')
            .select('current_round, status, start_time, role')
            .eq('id', user.id)
            .single()

        const isAdmin = team?.role === 'admin'

        // Admin bypass for round access
        if (pathname.match(/^\/round([1-9]|10)/)) {
            const roundMatch = pathname.match(/^\/round(\d+)/)
            const requestedRound = roundMatch ? parseInt(roundMatch[1]) : null

            if (!isAdmin && requestedRound && requestedRound > 1) {
                if (!team || !team.start_time || team.status === 'registered') {
                    return NextResponse.redirect(new URL('/dashboard', request.url))
                }
                // Must have completed previous round
                if (team.current_round < requestedRound - 1) {
                    return NextResponse.redirect(new URL('/dashboard', request.url))
                }
            }
        }

        // Admin protection for /admin routes
        if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
            if (!isAdmin) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|audio|circuits|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

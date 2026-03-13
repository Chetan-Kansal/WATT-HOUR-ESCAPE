import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ── Server-side client (uses cookies for auth context) ──────────────────────
export function createSupabaseServerClient() {
    const cookieStore = cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: Record<string, unknown>) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: Record<string, unknown>) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )
}

// ── Service role client (bypasses RLS — use ONLY in API routes) ─────────────
// Note: Not parameterized with Database generic to avoid @supabase/supabase-js
// v2 PostgREST schema version compatibility issues. Use explicit type casts on
// query results with the convenience types from @/types/database instead.
export function createSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}

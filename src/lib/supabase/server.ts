import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(options?: { role?: 'anon' | 'service_role' }) {
  const cookieStore = await cookies()
  const useServiceRole = options?.role === 'service_role'
  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In production, this is fine
          }
        },
      },
    }
  )
}

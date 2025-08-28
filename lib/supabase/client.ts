import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-key"

  console.log("[v0] Supabase client config:", {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "UNDEFINED",
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "UNDEFINED",
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  })

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn("[v0] Supabase client creation failed, using mock client:", error)
    // Return a mock client for development
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null }, error: new Error("Demo mode - no real authentication") }),
        signUp: () => Promise.resolve({ data: { user: null }, error: new Error("Demo mode - no real authentication") }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error("Demo mode - no database") })
          })
        }),
        insert: () => Promise.resolve({ data: null, error: new Error("Demo mode - no database") }),
        update: () => Promise.resolve({ data: null, error: new Error("Demo mode - no database") })
      })
    } as any
  }
}

export const supabase = createClient()

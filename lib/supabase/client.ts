import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase client config:", {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "UNDEFINED",
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "UNDEFINED",
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables:", {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
    })
    throw new Error("Missing Supabase environment variables")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createClient()

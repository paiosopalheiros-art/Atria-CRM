import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] Creating Supabase client...")
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase client config:", {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : "UNDEFINED",
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "UNDEFINED",
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    fullUrl: supabaseUrl, // Temporarily show full URL for debugging
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables:", {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
    })
    throw new Error("Missing Supabase environment variables")
  }

  try {
    console.log("[v0] Attempting to create browser client...")
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    console.log("[v0] Supabase browser client created successfully")
    return client
  } catch (error) {
    console.error("[v0] Failed to create Supabase client:", error)
    throw error
  }
}

export const supabase = createClient()

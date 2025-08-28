"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "./supabase/client"

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, userData: any) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("[v0] AuthProvider component initializing...")
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  console.log("[v0] AuthProvider state:", { loading, hasUser: !!user })

  useEffect(() => {
    console.log("[v0] AuthProvider useEffect triggered - calling checkAuth")
    checkAuth()
  }, [])

  // Fallback mechanism - if useEffect doesn't run, force auth check after component mount
  useLayoutEffect(() => {
    console.log("[v0] AuthProvider useLayoutEffect triggered as fallback")
    const timer = setTimeout(() => {
      if (loading) {
        console.log("[v0] Fallback: useEffect didn't run, forcing checkAuth")
        checkAuth()
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [loading])

  const checkAuth = async () => {
    console.log("[v0] Starting auth check with timeout protection...")
    
    // Add timeout protection
    const authTimeout = setTimeout(() => {
      console.warn("[v0] Auth check timeout after 10 seconds, forcing loading to false")
      setLoading(false)
      setUser(null)
    }, 10000)

    try {
      console.log("[v0] Environment check:", {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "..."
      })

      const supabase = createClient()
      console.log("[v0] Supabase client created successfully")

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      console.log("[v0] getSession completed:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        error: error?.message
      })

      clearTimeout(authTimeout)

      if (error) {
        console.error("[v0] Auth check error:", error)
        setUser(null)
      } else if (session?.user) {
        console.log("[v0] Found real session:", session.user.email)
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        })
      } else {
        console.log("[v0] No session found - user not logged in")
        setUser(null)
      }
    } catch (error) {
      clearTimeout(authTimeout)
      console.error("[v0] Auth check failed with error:", error)
      console.error("[v0] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      setUser(null)
    } finally {
      console.log("[v0] Auth check completed, setting loading to false")
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log("[v0] Attempting real Supabase login for:", email)

      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[v0] Login error:", error)
        throw new Error(error.message)
      }

      if (data.user) {
        console.log("[v0] Login successful:", data.user.email)
        setUser({
          id: data.user.id,
          email: data.user.email || "",
        })
      }
    } catch (error) {
      console.error("[v0] Login failed:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, userData: any) => {
    try {
      console.log("[v0] Attempting real Supabase registration for:", email)

      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) {
        console.error("[v0] Registration error:", error)
        throw new Error(error.message)
      }

      if (data.user) {
        console.log("[v0] Registration successful:", data.user.email)
        setUser({
          id: data.user.id,
          email: data.user.email || "",
        })
      }
    } catch (error) {
      console.error("[v0] Registration failed:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log("[v0] Real Supabase logout")

      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("[v0] Logout error:", error)
      }

      setUser(null)
    } catch (error) {
      console.error("[v0] Logout error:", error)
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

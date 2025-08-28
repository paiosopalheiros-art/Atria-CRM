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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log("[v0] Starting auth check...")

      const supabase = createClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("[v0] Auth check error:", error)
        // In demo mode, create a demo user
        console.log("[v0] Setting demo user")
        setUser({
          id: "demo-user-id",
          email: "paiosopalheiros@gmail.com"
        })
      } else if (session?.user) {
        console.log("[v0] Found real session:", session.user.email)
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        })
      } else {
        console.log("[v0] No session found, using demo mode")
        // For demo purposes, set a demo user
        setUser({
          id: "demo-user-id", 
          email: "paiosopalheiros@gmail.com"
        })
      }
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
      // Fallback to demo user
      setUser({
        id: "demo-user-id",
        email: "paiosopalheiros@gmail.com"
      })
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

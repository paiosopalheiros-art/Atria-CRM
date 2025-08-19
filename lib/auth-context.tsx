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
  const supabase = createClient()

  useEffect(() => {
    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.email)
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      console.log("[v0] Current session:", session?.user?.email)

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        })
      }
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log("[v0] Attempting login for:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("[v0] Login error:", error.message)

        if (error.message === "Invalid login credentials") {
          console.log("[v0] Attempting auto-registration for existing user:", email)

          try {
            const response = await fetch("/api/auth/auto-register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            })

            if (response.ok) {
              console.log("[v0] Auto-registration successful, retrying login")
              // Retry login after successful auto-registration
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email,
                password,
              })

              if (retryError) {
                throw new Error(retryError.message)
              }

              console.log("[v0] Login successful after auto-registration:", retryData.user?.email)
              return
            } else {
              const errorData = await response.json()
              console.log("[v0] Auto-registration failed:", errorData.error)
            }
          } catch (autoRegError) {
            console.error("[v0] Auto-registration error:", autoRegError)
          }
        }

        throw new Error(error.message)
      }

      console.log("[v0] Login successful:", data.user?.email)
      // User will be set via onAuthStateChange
    } catch (error) {
      console.error("[v0] Login failed:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, userData: any) => {
    try {
      console.log("[v0] Attempting registration for:", email)

      // Validate invite code
      const VALID_INVITE_CODES = {
        ADMIN2024: "admin",
        PARTNER2024: "partner",
        CAPTADOR2024: "captador",
      }

      const userType = VALID_INVITE_CODES[userData.inviteCode as keyof typeof VALID_INVITE_CODES]
      if (!userType) {
        throw new Error("Código de convite inválido")
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (error) {
        console.error("[v0] Registration error:", error.message)
        throw new Error(error.message)
      }

      if (data.user) {
        let defaultAgencyId: string

        try {
          // Try to get existing default agency
          const { data: existingAgency, error: agencyError } = await supabase
            .from("agencies")
            .select("id")
            .eq("name", "Agência Padrão")
            .single()

          if (existingAgency && !agencyError) {
            defaultAgencyId = existingAgency.id
            console.log("[v0] Using existing default agency:", defaultAgencyId)
          } else {
            // Create default agency if it doesn't exist
            const { data: newAgency, error: createError } = await supabase
              .from("agencies")
              .insert({
                name: "Agência Padrão",
                slug: "agencia-padrao",
                about: "Agência padrão para novos usuários",
                owner_id: data.user.id,
              })
              .select("id")
              .single()

            if (createError || !newAgency) {
              console.error("[v0] Failed to create default agency:", createError)
              throw new Error("Falha ao criar agência padrão")
            }

            defaultAgencyId = newAgency.id
            console.log("[v0] Created new default agency:", defaultAgencyId)
          }
        } catch (agencyError) {
          console.error("[v0] Agency setup error:", agencyError)
          throw new Error("Falha ao configurar agência")
        }

        const { error: profileError } = await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          email: data.user.email,
          full_name: userData.fullName,
          user_type: userType,
          phone: userData.phone || null,
          creci: userData.creci || null,
          agency_id: defaultAgencyId, // Always use valid agency ID
          invite_code: userData.inviteCode,
          is_active: true,
        })

        if (profileError) {
          console.error("[v0] Profile creation error:", profileError)
          throw new Error("Falha ao criar perfil do usuário")
        }

        console.log("[v0] User profile created with agency:", defaultAgencyId)
      }

      console.log("[v0] Registration successful:", data.user?.email)
    } catch (error) {
      console.error("[v0] Registration failed:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log("[v0] Logging out user")
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("[v0] Logout error:", error.message)
      }
      // User will be cleared via onAuthStateChange
    } catch (error) {
      console.error("[v0] Logout error:", error)
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

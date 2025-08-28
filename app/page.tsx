"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"
import { AdminDashboard } from "@/components/admin-dashboard"
import { PartnerDashboard } from "@/components/partner-dashboard"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import HomePage from "@/app/home/page"
import HouseLoader from "@/components/HouseLoader"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  user_type?: "admin" | "partner"
  is_active?: boolean
}

export interface LegacyUser {
  id: string
  email: string
  name: string
  userType: "admin" | "partner"
  isActive: boolean
}

export default function AtriaApp() {
  const { user, loading, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (user && !userProfile) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return

    setProfileLoading(true)
    try {
      console.log("[v0] Loading user profile for:", user.email)

      try {
        console.log("[v0] Querying user_profiles table for user_id:", user.id)
        const { data, error } = await supabase
          .from("user_profiles")
          .select("id, user_id, full_name, email, user_type, agency_id, is_active")
          .eq("user_id", user.id)
          .single()

        console.log("[v0] Database query result:", { data, error })

        if (data && !error) {
          console.log("[v0] User profile loaded from database:", data)
          setUserProfile({
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            user_type: data.user_type,
            is_active: data.is_active,
          })
          return
        }

        if (error) {
          console.log("[v0] Database error:", error)
        }
      } catch (dbError) {
        console.log("[v0] User profile not found, using auth data:", dbError)
      }

      console.log("[v0] Using auth user data as fallback")
      const userType = user.email === "paiosopalheiros@gmail.com" ? "admin" : getUserTypeFromEmail(user.email)
      console.log("[v0] Determined user type:", userType, "for email:", user.email)

      setUserProfile({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split("@")[0],
        user_type: userType,
        is_active: true,
      })
    } catch (error) {
      console.error("[v0] Error loading user profile:", error)
      const userType = user.email === "paiosopalheiros@gmail.com" ? "admin" : getUserTypeFromEmail(user.email)
      setUserProfile({
        id: user.id,
        email: user.email,
        full_name: user.email.split("@")[0],
        user_type: userType,
        is_active: true,
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const getUserTypeFromEmail = (email: string): "admin" | "partner" => {
    const emailLower = email.toLowerCase()

    if (emailLower.includes("admin") || emailLower.includes("atria") || emailLower.includes("administrador")) {
      return "admin"
    }
    // Everyone else is a partner (includes captadores, vendedores, etc.)
    return "partner"
  }

  const handleShowLogin = () => {
    console.log("[v0] Show login triggered")
    setShowLogin(true)
  }

  const handleLoginSuccess = () => {
    setShowLogin(false)
  }

  const handleLogout = async () => {
    try {
      console.log("[v0] Logging out user")
      await logout()
      setUserProfile(null)
      setShowLogin(false)
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
  }

  console.log(
    "[v0] Render state - isLoading:",
    loading,
    "showLogin:",
    showLogin,
    "currentUser:",
    !!user,
    "userProfile:",
    !!userProfile,
  )
  console.log("[v0] Full user object:", user)
  console.log("[v0] Loading state details:", { loading, timestamp: new Date().toISOString() })

  if (loading || (user && profileLoading)) {
    console.log("[v0] Rendering loading screen at:", new Date().toISOString())
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative">
            <HouseLoader className="w-20 h-20 text-primary mx-auto" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-foreground">Atria</h2>
            <p className="text-muted-foreground text-lg">Carregando sua plataforma...</p>
          </div>
        </div>
      </div>
    )
  }

  if (showLogin && !user) {
    console.log("[v0] Rendering login form")
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  if (user && userProfile) {
    const legacyUser: LegacyUser = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.full_name || userProfile.email.split("@")[0],
      userType: userProfile.user_type || "partner",
      isActive: userProfile.is_active || true,
    }

    console.log("[v0] Rendering dashboard for user type:", userProfile.user_type)
    if (userProfile.user_type === "admin") {
      return <AdminDashboard user={legacyUser} onLogout={handleLogout} />
    }

    return <PartnerDashboard user={legacyUser} onLogout={handleLogout} />
  }

  console.log("[v0] Rendering HomePage")
  return <HomePage onShowLogin={handleShowLogin} />
}

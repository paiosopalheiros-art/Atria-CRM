"use client"

import { useAuth } from "@/lib/auth-context"
import LandingPage from "./landing-page"
import AdminDashboard from "./admin-dashboard"
import PartnerDashboard from "./partner-dashboard"

export default function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If user is not logged in, show landing page
  if (!user) {
    return <LandingPage />
  }

  // If user is logged in, show appropriate dashboard
  const userType = user.email?.includes("admin") ? "admin" : "partner"

  if (userType === "admin") {
    return <AdminDashboard />
  }

  return <PartnerDashboard />
}

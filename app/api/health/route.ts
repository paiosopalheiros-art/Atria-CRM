import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Simple health check without database queries
    return ApiResponseHelper.success({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      supabase_configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    })
  } catch (error) {
    console.error("Health check error:", error)
    return ApiResponseHelper.serverError("Health check failed")
  }
}

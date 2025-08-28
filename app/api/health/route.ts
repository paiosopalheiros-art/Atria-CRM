import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from("agencies").select("id").limit(1)

    if (error) {
      throw error
    }

    return ApiResponseHelper.success({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      supabase: "connected",
    })
  } catch (error) {
    return ApiResponseHelper.serverError("Database connection failed")
  }
}

import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const userId = searchParams.get("userId")

      let query = supabase.from("properties").select("status, approval_status, price")

      if (userId) {
        query = query.eq("owner_id", userId)
      }

      if (user.user_type !== "admin") {
        query = query.eq("approval_status", "approved")
      }

      const { data: properties, error } = await query

      if (error) {
        throw error
      }

      // Calculate stats from the data
      const stats = {
        total: properties?.length || 0,
        available: properties?.filter((p) => p.status === "available").length || 0,
        reserved: properties?.filter((p) => p.status === "reserved").length || 0,
        sold: properties?.filter((p) => p.status === "sold").length || 0,
        pending_approval: properties?.filter((p) => p.approval_status === "pending").length || 0,
        approved: properties?.filter((p) => p.approval_status === "approved").length || 0,
        rejected: properties?.filter((p) => p.approval_status === "rejected").length || 0,
        average_price: 0,
        min_price: 0,
        max_price: 0,
      }

      if (properties && properties.length > 0) {
        const prices = properties.map((p) => Number.parseFloat(p.price) || 0).filter((p) => p > 0)
        if (prices.length > 0) {
          stats.average_price = prices.reduce((sum, price) => sum + price, 0) / prices.length
          stats.min_price = Math.min(...prices)
          stats.max_price = Math.max(...prices)
        }
      }

      return ApiResponseHelper.success(stats)
    } catch (error) {
      console.error("Get property stats error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar estatísticas")
    }
  })
}

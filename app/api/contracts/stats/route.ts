import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const userId = searchParams.get("userId")

      let query = supabase.from("contracts").select("*")

      if (userId) {
        query = query.or(`captador_id.eq.${userId},partner_id.eq.${userId}`)
      } else if (user.user_type !== "admin") {
        query = query.or(`captador_id.eq.${user.id},partner_id.eq.${user.id}`)
      }

      const { data: contracts, error } = await query

      if (error) throw error

      const stats = {
        total_contracts: contracts?.length || 0,
        pending_contracts: contracts?.filter((c) => c.status === "pending").length || 0,
        signed_contracts: contracts?.filter((c) => c.status === "signed").length || 0,
        active_contracts: contracts?.filter((c) => c.status === "active").length || 0,
        completed_contracts: contracts?.filter((c) => c.status === "completed").length || 0,
        total_commission_value:
          contracts
            ?.filter((c) => ["signed", "active", "completed"].includes(c.status))
            .reduce((sum, c) => sum + (c.property_value * c.total_commission) / 100, 0) || 0,
        average_property_value:
          contracts?.length > 0 ? contracts.reduce((sum, c) => sum + c.property_value, 0) / contracts.length : 0,
      }

      return ApiResponseHelper.success(stats)
    } catch (error) {
      console.error("Get contract stats error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar estatísticas de contratos")
    }
  })
}
